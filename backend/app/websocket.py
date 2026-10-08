import logging
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.utils.security import decode_access_token

logger = logging.getLogger("booknest.websocket")

class ConnectionManager:
    def __init__(self):
        # Maps user_id -> Set of WebSocket connections
        self.user_connections: Dict[str, Set[WebSocket]] = {}
        # Maps shelf_id -> Set of user_ids subscribed
        self.shelf_subscribers: Dict[str, Set[str]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)
        logger.info(f"WebSocket connected for user: {user_id}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        logger.info(f"WebSocket disconnected for user: {user_id}")

    def subscribe_shelf(self, user_id: str, shelf_id: str):
        if shelf_id not in self.shelf_subscribers:
            self.shelf_subscribers[shelf_id] = set()
        self.shelf_subscribers[shelf_id].add(user_id)

    def unsubscribe_shelf(self, user_id: str, shelf_id: str):
        if shelf_id in self.shelf_subscribers:
            self.shelf_subscribers[shelf_id].discard(user_id)

    async def broadcast_to_user(self, user_id: str, message: dict):
        if user_id in self.user_connections:
            disconnected = []
            for connection in self.user_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to user {user_id}: {e}")
                    disconnected.append(connection)
            for conn in disconnected:
                self.user_connections[user_id].discard(conn)

    async def broadcast_to_shelf(self, shelf_id: str, message: dict, shelf_user_ids: list = None):
        target_users = set(shelf_user_ids or [])
        if shelf_id in self.shelf_subscribers:
            target_users.update(self.shelf_subscribers[shelf_id])

        for uid in target_users:
            await self.broadcast_to_user(uid, message)

manager = ConnectionManager()

websocket_router = APIRouter(tags=["WebSocket"])

@websocket_router.websocket("/api/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    user_id = None
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
    except Exception:
        await websocket.close(code=4001, reason="Invalid token")
        return

    if not user_id:
        await websocket.close(code=4001, reason="Invalid user payload")
        return

    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            if action == "subscribe_shelf":
                shelf_id = data.get("shelf_id")
                if shelf_id:
                    manager.subscribe_shelf(user_id, shelf_id)
            elif action == "unsubscribe_shelf":
                shelf_id = data.get("shelf_id")
                if shelf_id:
                    manager.unsubscribe_shelf(user_id, shelf_id)
            elif action == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket exception: {e}")
        manager.disconnect(websocket, user_id)
