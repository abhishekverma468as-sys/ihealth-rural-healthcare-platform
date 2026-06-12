"""
ASGI config for iHealth project.
Supports both HTTP (Django) and WebSocket (Django Channels) connections.
Daphne serves this application — no external server needed for WebSockets.
"""

import os
# pyrefly: ignore [missing-import]
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ihealth_project.settings')

# Import WebSocket URL patterns AFTER setting DJANGO_SETTINGS_MODULE
import websocket.routing

application = ProtocolTypeRouter({
    # HTTP requests → standard Django ASGI handler
    "http": get_asgi_application(),
    # WebSocket requests → Django Channels with JWT auth middleware
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket.routing.websocket_urlpatterns
        )
    ),
})
