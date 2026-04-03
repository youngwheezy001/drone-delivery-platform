from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict
import json

from app.models.database import get_db
from app.models.chat import ChatMessage

router = APIRouter()

# --- REAL-TIME CHAT HUB ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

manager = ConnectionManager()

@router.get("/history/{order_id}")
async def get_chat_history(order_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch previous transmissions for a specific mission node. 🛰️📜"""
    result = await db.execute(select(ChatMessage).where(ChatMessage.order_id == order_id).order_by(ChatMessage.timestamp))
    return result.scalars().all()

@router.websocket("/ws/{user_id}")
async def chat_socket_endpoint(websocket: WebSocket, user_id: str, db: AsyncSession = Depends(get_db)):
    """The primary mission-support link for real-time traffic. 🛰️💬"""
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # 📍 Payload Structure: { "order_id": "...", "recipient_id": "...", "message": "..." }
            order_id = message_data.get("order_id")
            recipient_id = message_data.get("recipient_id")
            msg_text = message_data.get("message")

            if order_id and recipient_id and msg_text:
                # 📜 Global Persistence
                new_msg = ChatMessage(
                    order_id=order_id,
                    sender_id=user_id,
                    recipient_id=recipient_id,
                    message=msg_text
                )
                db.add(new_msg)
                await db.commit()

                # 🚀 Real-time Dispatch
                await manager.send_personal_message(json.dumps({
                    "id": new_msg.id,
                    "order_id": order_id,
                    "sender_id": user_id,
                    "message": msg_text,
                    "timestamp": str(new_msg.timestamp)
                }), recipient_id)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        print(f"Chat WS Error: {e}")
        manager.disconnect(user_id)
