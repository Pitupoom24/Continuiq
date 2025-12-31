from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth.hashers import make_password, check_password
from django.db import connection
from rest_framework_simplejwt.tokens import RefreshToken

class UserViewSet(viewsets.ViewSet):
    """
    ViewSet for managing user-related operations including registration, 
    authentication, and profile management using raw SQL queries.
    """
    
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        Overrides default permissions for registration and login to allow public access.
        """
        if self.action in ['create', 'login', 'update']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_tokens_for_user(self, user_id):
        """
        Manually generates a new pair of Refresh and Access JWT tokens for a specific user.
        
        Args:
            user_id (int/str): The unique identifier of the user.
        Returns:
            dict: Containing 'refresh' and 'access' token strings.
        """
        refresh = RefreshToken()
        refresh['user_id'] = str(user_id) 
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

    def check_ownership(self, request, pk):
        """
        Security Utility: Validates that the authenticated user is accessing their own resource.
        This is a critical check to prevent Insecure Direct Object Reference (IDOR) attacks.
        
        Args:
            request: The current DRF request object.
            pk (str): The primary key from the URL path.
        Returns:
            bool: True if authorized, False otherwise.
        """
        if str(request.user.id) != str(pk):
            return False
        return True

    def list(self, request):
        """
        GET /users/
        Retrieves the profile information for the currently authenticated user.
        Restricted to the requester's own data to ensure privacy.
        """
        current_user_id = request.user.id
        query = "SELECT id, email, created_at FROM users WHERE id = %s"
        
        with connection.cursor() as cursor:
            cursor.execute(query, [current_user_id])
            columns = [col[0] for col in cursor.description]
            row = cursor.fetchone()
            if row:
                user_data = dict(zip(columns, row))
                return Response({"data": [user_data]})
        
        return Response({"data": []})

    def create(self, request):
        """
        POST /users/
        Registers a new user in the system. 
        Hashes the password before persistence and returns initial JWT tokens.
        """
        data = request.data
        email = data.get('email')
        raw_password = data.get('password')

        if not email or not raw_password:
            return Response({"error": "Missing email/password"}, status=status.HTTP_400_BAD_REQUEST)

        hashed_password = make_password(raw_password)
        query = "INSERT INTO users (email, password) VALUES (%s, %s) RETURNING id, created_at"
        
        try:
            with connection.cursor() as cursor:
                cursor.execute(query, [email, hashed_password])
                row = cursor.fetchone()
                user_id, created_at = row[0], row[1]
            
            tokens = self.get_tokens_for_user(user_id)
            return Response({
                "id": user_id,
                "email": email,
                "tokens": tokens,
                "created_at": created_at
            }, status=status.HTTP_201_CREATED)
        except Exception:
            return Response({"error": "User already exists or DB error"}, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        """
        GET /users/{id}/
        Retrieves detailed profile information for a specific user ID.
        Includes an ownership check to prevent unauthorized data exposure.
        """
        if not self.check_ownership(request, pk):
            return Response({"error": "Forbidden: You cannot view other users."}, status=status.HTTP_403_FORBIDDEN)

        query = "SELECT id, email, created_at FROM users WHERE id = %s"
        with connection.cursor() as cursor:
            cursor.execute(query, [pk])
            row = cursor.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                "id": row[0],
                "email": row[1],
                "created_at": row[2]
            })

    def update(self, request, pk=None):
        """
        PUT /users/{id}/
        Updates the email and password for a specific user.
        Requires ownership verification and provides error handling for unique constraints.
        """
        if not self.check_ownership(request, pk):
            return Response({"error": "Forbidden: You cannot update other users."}, status=status.HTTP_403_FORBIDDEN)

        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({"error": "Email and password are required for update"}, status=status.HTTP_400_BAD_REQUEST)

        hashed_password = make_password(password)
        query = "UPDATE users SET email = %s, password = %s WHERE id = %s"
        
        try:
            with connection.cursor() as cursor:
                cursor.execute(query, [email, hashed_password, pk])
                if cursor.rowcount == 0:
                    return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
                return Response({"message": "User updated successfully"})
        except Exception:
            return Response({"error": "User already exists or DB error"}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        """
        DELETE /users/{id}/
        Performs a hard delete of the user record from the database.
        Verified via ownership check to ensure users can only delete their own account.
        """
        if not self.check_ownership(request, pk):
            return Response({"error": "Forbidden: You cannot delete other users."}, status=status.HTTP_403_FORBIDDEN)

        query = "DELETE FROM users WHERE id = %s"
        with connection.cursor() as cursor:
            cursor.execute(query, [pk])
            if cursor.rowcount == 0:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({"message": "Account deleted"}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'])
    def login(self, request):
        """
        POST /users/login/
        Authenticates a user via email and password.
        Returns user metadata and a fresh JWT pair upon successful verification.
        """
        email = request.data.get('email')
        password = request.data.get('password')

        query = "SELECT id, password FROM users WHERE email = %s"
        with connection.cursor() as cursor:
            cursor.execute(query, [email])
            row = cursor.fetchone()

        if row and check_password(password, row[1]):
            tokens = self.get_tokens_for_user(row[0])
            return Response({
                "id": row[0],
                "email": email, 
                "tokens": tokens
            }, status=status.HTTP_200_OK)
        
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)