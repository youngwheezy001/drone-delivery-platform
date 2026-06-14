from sqlalchemy import Column, String, Float, DateTime, ForeignKey
import uuid
from datetime import datetime
from .database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    delivery_id = Column(String, ForeignKey("deliveries.id"))
    customer_id = Column(String, ForeignKey("users.id"))
    partner_id = Column(String, ForeignKey("users.id"))
    
    total_amount_kes = Column(Float)
    partner_payout_kes = Column(Float)
    platform_fee_kes = Column(Float)
    
    status = Column(String, default="PENDING") # PENDING, CLEARED, REFUNDED, FAILED
    checkout_request_id = Column(String, nullable=True) # M-Pesa tracking ID
    created_at = Column(DateTime, default=datetime.utcnow)
