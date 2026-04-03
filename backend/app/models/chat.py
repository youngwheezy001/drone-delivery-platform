from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
import uuid
from app.models.database import Base

class ChatMessage(Base):
    """
    Mission-Critical Support Link. 🛰️💬
    Stores real-time transmissions between Customers and Merchant Hubs.
    """
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, index=True, nullable=False)
    sender_id = Column(String, nullable=False) # Email or Hub ID
    recipient_id = Column(String, nullable=False)
    message = Column(String, nullable=False)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
