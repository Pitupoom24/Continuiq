from rest_framework_simplejwt.authentication import JWTAuthentication
from types import SimpleNamespace

class RawSQLJWTAuthentication(JWTAuthentication):
    """
    Custom Authentication backend that overrides the default JWT behavior 
    to bypass Django's ORM and the 'auth_user' table.
    
    This is specifically designed for architectures using raw SQL for user management,
    allowing the request.user object to be populated directly from token claims.
    """

    def get_user(self, validated_token):
        """
        Retrieves the user identity from the validated JWT payload.
        
        Instead of performing a database lookup via the Django ORM, this method 
        constructs a lightweight object representing the authenticated user.

        Args:
            validated_token (dict): The decoded and verified JWT payload.

        Returns:
            SimpleNamespace: A mock user object containing the 'id' and 'is_authenticated' 
                             status, compatible with DRF permission checks.
            None: If the user_id claim is missing.
        """
        user_id = validated_token.get('user_id')
        
        if not user_id:
            return None

        # Create a stateless user object to facilitate compatibility with DRF's 
        # request.user interface (e.g., request.user.id and request.user.is_authenticated)
        # without requiring a corresponding record in a Django-managed table.
        return SimpleNamespace(id=user_id, is_authenticated=True)