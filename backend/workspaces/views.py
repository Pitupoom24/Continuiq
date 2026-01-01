from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from django.db import connection

DEFAULT_WORKSPACE_NAME = "New Workspace"

class WorkspaceViewSet(viewsets.ViewSet):
    """
    ViewSet for managing user workspaces using raw SQL queries.
    Handles the lifecycle of workspaces including creation, retrieval, 
    renaming, and deletion with strict user-based isolation.
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        """
        GET /workspaces/
        Retrieves a list of all workspaces belonging to the authenticated user.
        Uses a dictionary mapping to return structured data from raw SQL rows.
        """
        current_user_id = request.user.id
        query = "SELECT id, user_id, name, created_at FROM workspaces WHERE user_id = %s"
        
        with connection.cursor() as cursor:
            cursor.execute(query, [current_user_id])
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            response = [dict(zip(columns, r)) for r in rows]
            return Response({"data": response})

    def create(self, request):
        """
        POST /workspaces/
        Initializes a new workspace for the current user.
        Supports custom naming or defaults to a standard placeholder if no name is provided.
        """
        current_user_id = request.user.id
        name = request.data.get('name', DEFAULT_WORKSPACE_NAME)
        
        query = "INSERT INTO workspaces(user_id, name) VALUES (%s, %s) RETURNING id, created_at"
        try:
            with connection.cursor() as cursor:
                cursor.execute(query, [current_user_id, name])
                row = cursor.fetchone()
                return Response({
                    "id": row[0],
                    "user_id": current_user_id,
                    "name": name,
                    "created_at": row[1]
                }, status=status.HTTP_201_CREATED)
        except Exception:
            return Response({"error": "Failed to create workspace"}, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        """
        GET /workspaces/{id}/
        Fetches details for a specific workspace.
        Enforces security by validating ownership within the SQL WHERE clause 
        to prevent unauthorized cross-user access.
        """
        current_user_id = request.user.id
        
        query = "SELECT id, name, created_at FROM workspaces WHERE id = %s AND user_id = %s"
        
        with connection.cursor() as cursor:
            cursor.execute(query, [pk, current_user_id])
            row = cursor.fetchone()
            
            if not row:
                return Response({"error": "Workspace not found or access denied"}, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                "id": row[0],
                "name": row[1],
                "created_at": row[2]
            })

    def partial_update(self, request, pk=None):
        """
        PATCH /workspaces/{id}/
        Updates the name of an existing workspace.
        Ensures the operation is only performed if the workspace belongs to the requester.
        """
        current_user_id = request.user.id
        new_name = request.data.get('name')

        if not new_name:
            return Response({"error": "Name field is required for renaming"}, status=status.HTTP_400_BAD_REQUEST)

        query = "UPDATE workspaces SET name = %s WHERE id = %s AND user_id = %s"
        
        with connection.cursor() as cursor:
            cursor.execute(query, [new_name, pk, current_user_id])
            
            if cursor.rowcount == 0:
                return Response({"error": "Workspace not found or access denied"}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({"message": "Workspace renamed successfully", "new_name": new_name})

    def destroy(self, request, pk=None):
        """
        DELETE /workspaces/{id}/
        Removes a workspace from the system.
        Relies on database-level constraints (ON DELETE CASCADE) to clean up 
        associated child records like chats and messages.
        """
        current_user_id = request.user.id
        
        # SQL will automatically cascade delete chats/messages
        query = "DELETE FROM workspaces WHERE id = %s AND user_id = %s"
        
        with connection.cursor() as cursor:
            cursor.execute(query, [pk, current_user_id])
            
            if cursor.rowcount == 0:
                return Response({"error": "Workspace not found or access denied"}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({"message": "Workspace and all associated data deleted"}, status=status.HTTP_204_NO_CONTENT)