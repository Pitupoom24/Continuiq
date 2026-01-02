from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from django.db import connection, transaction
from .ai_services import ask_gemini

class ChatViewSet(viewsets.ViewSet):
    """
    ViewSet for managing spatial chat windows on the canvas.
    Handles window positions, dimensions, and the 'Highlight-to-Branch' creation logic.
    """
    
    permission_classes = [permissions.IsAuthenticated]

    def _verify_workspace_ownership(self, user_id, workspace_id):
        """
        Internal Utility: Validates that the workspace belongs to the authenticated user.
        """
        query = "SELECT id FROM workspaces WHERE id = %s AND user_id = %s"
        with connection.cursor() as cursor:
            cursor.execute(query, [workspace_id, user_id])
            return cursor.fetchone() is not None

    def list(self, request):
        """
        GET /canvas/chats/?workspace_id={uuid}
        Retrieves all chat windows for a specific workspace.
        Used to hydrate the canvas layout on initial load.
        """
        workspace_id = request.query_params.get('workspace_id')
        current_user_id = request.user.id

        if not workspace_id:
            return Response({"error": "workspace_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure the user owns the workspace they are trying to view
        if not self._verify_workspace_ownership(current_user_id, workspace_id):
            return Response({"error": "Forbidden: Workspace access denied"}, status=status.HTTP_403_FORBIDDEN)

        query = """
            SELECT id, title, x_pos, y_pos, width, height, z_index, created_at 
            FROM chats 
            WHERE workspace_id = %s
            ORDER BY created_at ASC
        """
        with connection.cursor() as cursor:
            cursor.execute(query, [workspace_id])
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            return Response({"data": [dict(zip(columns, r)) for r in rows]})

    def create(self, request):
        """
        POST /canvas/chats/
        Creates a new chat window. 
        If 'source_message_id' is provided, it automatically creates a 'message_link' (Arrow),
        implementing the seamless branching feature.
        """
        data = request.data
        user_id = request.user.id
        workspace_id = data.get('workspace_id')
        title = data.get('title', 'New Chat')
        x_pos = data.get('x_pos', 0)
        y_pos = data.get('y_pos', 0)

        # Branching specific data
        source_message_id = data.get('source_message_id')
        start_offset = data.get('start_offset')
        end_offset = data.get('end_offset')

        if not self._verify_workspace_ownership(user_id, workspace_id):
            return Response({"error": "Forbidden: Workspace access denied"}, status=status.HTTP_403_FORBIDDEN)

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    # 1. Create the New Chat Window
                    cursor.execute(
                        "INSERT INTO chats (workspace_id, title, x_pos, y_pos) VALUES (%s, %s, %s, %s) RETURNING id",
                        [workspace_id, title, x_pos, y_pos]
                    )
                    new_chat_id = cursor.fetchone()[0]

                    # 2. If this is a branched chat, create the visual link (The Arrow)
                    link_id = None
                    if source_message_id and start_offset is not None and end_offset is not None:
                        # We need to find which chat the source message belonged to
                        cursor.execute("SELECT chat_id FROM messages WHERE id = %s", [source_message_id])
                        from_chat_row = cursor.fetchone()
                        
                        if from_chat_row:
                            from_chat_id = from_chat_row[0]
                            cursor.execute(
                                """
                                INSERT INTO message_links 
                                (source_message_id, start_offset, end_offset, from_chat_id, to_chat_id)
                                VALUES (%s, %s, %s, %s, %s) RETURNING id
                                """,
                                [source_message_id, start_offset, end_offset, from_chat_id, new_chat_id]
                            )
                            link_id = cursor.fetchone()[0]
                        
                        # 3. Fetch last 10 messages from parent
                        cursor.execute(
                            "SELECT role, content FROM messages WHERE chat_id = %s ORDER BY order_index DESC LIMIT 10", 
                            [from_chat_id]
                        )
                        parent_history = reversed(cursor.fetchall())

                        # 4. Inject into NEW chat but hide them from the UI
                        for idx, (role, content) in enumerate(parent_history):
                            cursor.execute(
                                """
                                INSERT INTO messages (chat_id, role, content, order_index, is_hidden) 
                                VALUES (%s, %s, %s, %s, TRUE)
                                """,
                                [new_chat_id, role, content, idx]
                            )

                    return Response({
                        "chat_id": new_chat_id,
                        "link_id": link_id,
                        "message": "Chat branched successfully" if link_id else "Chat created"
                    }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, pk=None):
        """
        PATCH /canvas/chats/{id}/
        Updates window metadata (position, size, z-index).
        Designed to be called by the frontend's debounced auto-save logic.
        """
        user_id = request.user.id
        data = request.data
        
        # Fields allowed for layout updates
        allowed_fields = ['x_pos', 'y_pos', 'width', 'height', 'z_index', 'title']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}

        if not update_data:
            return Response({"error": "No valid fields provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Ownership check: Ensure chat belongs to a workspace owned by the user
        check_query = """
            SELECT c.id FROM chats c 
            JOIN workspaces w ON c.workspace_id = w.id 
            WHERE c.id = %s AND w.user_id = %s
        """
        
        with connection.cursor() as cursor:
            cursor.execute(check_query, [pk, user_id])
            if not cursor.fetchone():
                return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

            # Build dynamic SQL update string
            set_clause = ", ".join([f"{k} = %s" for k in update_data.keys()])
            params = list(update_data.values()) + [pk]
            
            cursor.execute(f"UPDATE chats SET {set_clause} WHERE id = %s", params)

        return Response({"message": "Layout saved"})

    def destroy(self, request, pk=None):
        """
        DELETE /canvas/chats/{id}/
        Removes a chat window and all its messages.
        Postgres CASCADE handles the deletion of associated message_links.
        """
        user_id = request.user.id
        
        query = """
            DELETE FROM chats 
            WHERE id = %s AND workspace_id IN (SELECT id FROM workspaces WHERE user_id = %s)
        """
        with connection.cursor() as cursor:
            cursor.execute(query, [pk, user_id])
            if cursor.rowcount == 0:
                return Response({"error": "Not found or access denied"}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({"message": f"Chat id: {pk} has been deleted"}, status=status.HTTP_200_OK)
    







class MessageViewSet(viewsets.ViewSet):
    """
    ViewSet for managing chat history and AI interactions.
    Implements context-aware responses and sequential message ordering.
    """
    
    permission_classes = [permissions.IsAuthenticated]

    def _check_chat_ownership(self, user_id, chat_id):
        """
        Security Utility: Ensures the chat belongs to the authenticated user.
        """
        query = """
            SELECT c.id FROM chats c
            JOIN workspaces w ON c.workspace_id = w.id
            WHERE c.id = %s AND w.user_id = %s
        """
        with connection.cursor() as cursor:
            cursor.execute(query, [chat_id, user_id])
            return cursor.fetchone() is not None

    def list(self, request):
        """
        GET /canvas/messages/?chat_id={uuid}
        Retrieves the conversation history for a specific window.
        """
        chat_id = request.query_params.get('chat_id')
        user_id = request.user.id

        if not chat_id or not self._check_chat_ownership(user_id, chat_id):
            return Response({"error": "Unauthorized or missing chat_id"}, status=status.HTTP_403_FORBIDDEN)

        query = """
            SELECT id, role, content, order_index, created_at
            FROM messages
            WHERE chat_id = %s AND is_hidden = FALSE
            ORDER BY order_index ASC
            """
        
        with connection.cursor() as cursor:
            cursor.execute(query, [chat_id])
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            return Response({"data": [dict(zip(columns, r)) for r in rows]})

    def create(self, request):
        """
        POST /canvas/messages/
        1. Saves the user's prompt.
        2. Fetches the last 10 messages for context.
        3. Requests a response from Gemini.
        4. Saves and returns the AI response.
        """
        user_id = request.user.id
        chat_id = request.data.get('chat_id')
        content = request.data.get('content')

        if not chat_id or not content:
            return Response({"error": "chat_id and content are required"}, status=status.HTTP_400_BAD_REQUEST)

        if not self._check_chat_ownership(user_id, chat_id):
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)

        try:
            with connection.cursor() as cursor:
                # 1. Get the current highest order_index
                cursor.execute("SELECT COALESCE(MAX(order_index), -1) FROM messages WHERE chat_id = %s", [chat_id])
                last_index = cursor.fetchone()[0]

                # 2. Save User Message
                cursor.execute(
                    "INSERT INTO messages (chat_id, role, content, order_index) VALUES (%s, %s, %s, %s) RETURNING id",
                    [chat_id, 'user', content, last_index + 1]
                )
                user_msg_id = cursor.fetchone()[0]

                # 3. Fetch History for Gemini (Last 10 messages)
                cursor.execute(
                    "SELECT role, content FROM messages WHERE chat_id = %s ORDER BY order_index DESC LIMIT 10",
                    [chat_id]
                )
                # Reverse it so Gemini gets it in chronological order
                history = [{"role": r, "content": c} for r, c in reversed(cursor.fetchall())]

                # 4. Save and Return Gemini Response
                ai_content = ask_gemini(history, content)

                cursor.execute(
                    "INSERT INTO messages (chat_id, role, content, order_index) VALUES (%s, %s, %s, %s) RETURNING id, created_at",
                    [chat_id, 'model', ai_content, last_index + 2]
                )
                row = cursor.fetchone()
                
                return Response({
                    "user_message_id": user_msg_id,
                    "model_message": {
                        "id": row[0],
                        "role": "model",
                        "content": ai_content,
                        "created_at": row[1]
                    }
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        







class LinkViewSet(viewsets.ViewSet):
    """
    ViewSet for retrieving visual connections (Arrows) between chat windows.
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """
        GET /canvas/links/?workspace_id={uuid}
        Retrieves all arrows for the canvas. 
        Returns coordinates and source text for the 'Glow Aura' effect.
        """
        workspace_id = request.query_params.get('workspace_id')
        user_id = request.user.id

        # Security: Ensure user owns the workspace these links belong to
        query = """
            SELECT ml.id, ml.source_message_id, ml.start_offset, ml.end_offset, 
                   ml.from_chat_id, ml.to_chat_id, ml.created_at
            FROM message_links ml
            JOIN chats c ON ml.from_chat_id = c.id
            JOIN workspaces w ON c.workspace_id = w.id
            WHERE w.id = %s AND w.user_id = %s
        """
        
        with connection.cursor() as cursor:
            cursor.execute(query, [workspace_id, user_id])
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            return Response({"data": [dict(zip(columns, r)) for r in rows]})