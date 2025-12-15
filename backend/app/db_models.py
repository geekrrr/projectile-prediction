from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    history_entries = relationship("History", back_populates="owner")

class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Simulation Parameters
    v0 = Column(Float)
    angle = Column(Float)
    drag = Column(Float)
    
    # Results
    impact_physics = Column(Float)
    impact_ml = Column(Float, nullable=True)
    
    # Full JSON dump for detailed recreation
    full_data = Column(JSON)

    owner = relationship("User", back_populates="history_entries")
