from datetime import datetime
import uuid
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    avatar_url = Column(String(300), nullable=True)
    role = Column(String(50), default="member")
    created_at = Column(DateTime, default=datetime.utcnow)

    hosted_meetings = relationship("Meeting", back_populates="host")

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    meeting_number = Column(String(20), unique=True, nullable=False, index=True)
    topic = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    passcode = Column(String(50), nullable=True)
    host_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    meeting_type = Column(String(20), default="instant")
    status = Column(String(20), default="upcoming")
    start_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=30)
    created_at = Column(DateTime, default=datetime.utcnow)

    host = relationship("User", back_populates="hosted_meetings")
    participants = relationship("MeetingParticipant", back_populates="meeting", cascade="all, delete-orphan")
    messages = relationship("MeetingMessage", back_populates="meeting", cascade="all, delete-orphan")

class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    meeting_id = Column(String(36), ForeignKey("meetings.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    user_name = Column(String(100), nullable=False)
    role = Column(String(20), default="participant")
    is_muted = Column(Boolean, default=False)
    is_camera_off = Column(Boolean, default=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    left_at = Column(DateTime, nullable=True)

    meeting = relationship("Meeting", back_populates="participants")

class MeetingMessage(Base):
    __tablename__ = "meeting_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    meeting_id = Column(String(36), ForeignKey("meetings.id"), nullable=False)
    sender_name = Column(String(100), nullable=False)
    sender_id = Column(String(50), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="messages")
