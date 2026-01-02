from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatViewSet, MessageViewSet, LinkViewSet

router = DefaultRouter()
router.register(r'chats', ChatViewSet, basename='chats')
router.register(r'messages', MessageViewSet, basename='messages')
router.register(r'links', LinkViewSet, basename='links')

urlpatterns = [
    path('', include(router.urls)),
]