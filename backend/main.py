import random
import string
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from database import engine, get_db, Base
import models
import schemas
from websocket_manager import manager
from seed import seed_database

Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(title="Zoom Flow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_meeting_number() -> str:
    p1 = random.randint(100, 999)
    p2 = random.randint(100, 999)
    p3 = random.randint(1000, 9999)
    return f"{p1}{p2}{p3}"

def generate_passcode(length: int = 6) -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choice(chars) for _ in range(length))

def get_or_create_default_user(db: Session) -> models.User:
    user = db.query(models.User).filter(models.User.email == "alex.morgan@zoomflow.internal").first()
    if not user:
        user = models.User(
            name="Alex Morgan",
            email="alex.morgan@zoomflow.internal",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            role="Engineering Lead"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/dashboard", response_model=schemas.DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    
    upcoming = (
        db.query(models.Meeting)
        .filter(models.Meeting.status == "upcoming")
        .order_by(models.Meeting.start_time.asc())
        .all()
    )

    recent = (
        db.query(models.Meeting)
        .filter(models.Meeting.status == "ended")
        .order_by(desc(models.Meeting.created_at))
        .limit(10)
        .all()
    )

    return {
        "user": user,
        "upcoming_meetings": upcoming,
        "recent_meetings": recent
    }

@app.get("/api/meetings/upcoming", response_model=List[schemas.MeetingResponse])
def get_upcoming_meetings(db: Session = Depends(get_db)):
    return (
        db.query(models.Meeting)
        .filter(models.Meeting.status == "upcoming")
        .order_by(models.Meeting.start_time.asc())
        .all()
    )

@app.get("/api/meetings/recent", response_model=List[schemas.MeetingResponse])
def get_recent_meetings(db: Session = Depends(get_db)):
    return (
        db.query(models.Meeting)
        .filter(models.Meeting.status == "ended")
        .order_by(desc(models.Meeting.created_at))
        .all()
    )

@app.post("/api/meetings/instant", response_model=schemas.MeetingResponse)
def create_instant_meeting(payload: schemas.MeetingCreateInstant, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    meeting_num = generate_meeting_number()
    passcode = payload.passcode if payload.passcode else generate_passcode(6)

    meeting = models.Meeting(
        meeting_number=meeting_num,
        topic=payload.topic or f"{user.name}'s Personal Meeting Room",
        description="Instant video conference session",
        passcode=passcode,
        host_id=user.id,
        meeting_type="instant",
        status="live",
        start_time=datetime.utcnow(),
        duration_minutes=45
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting

@app.post("/api/meetings/schedule", response_model=schemas.MeetingResponse)
def schedule_meeting(payload: schemas.MeetingScheduleCreate, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    meeting_num = generate_meeting_number()
    passcode = payload.passcode if payload.passcode else generate_passcode(6)

    meeting = models.Meeting(
        meeting_number=meeting_num,
        topic=payload.topic,
        description=payload.description,
        passcode=passcode,
        host_id=user.id,
        meeting_type="scheduled",
        status="upcoming",
        start_time=payload.start_time,
        duration_minutes=payload.duration_minutes
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting

@app.post("/api/meetings/validate")
def validate_meeting(payload: schemas.MeetingJoinValidate, db: Session = Depends(get_db)):
    cleaned_identifier = payload.meeting_identifier.replace("-", "").replace(" ", "").strip()
    
    meeting = (
        db.query(models.Meeting)
        .filter(
            or_(
                models.Meeting.id == payload.meeting_identifier.strip(),
                models.Meeting.meeting_number == cleaned_identifier
            )
        )
        .first()
    )

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found. Please verify the Meeting ID or link.")

    if meeting.passcode and payload.passcode:
        if meeting.passcode.strip().lower() != payload.passcode.strip().lower():
            raise HTTPException(status_code=403, detail="Invalid meeting passcode.")

    return {
        "valid": True,
        "id": meeting.id,
        "meeting_number": meeting.meeting_number,
        "topic": meeting.topic,
        "host_id": meeting.host_id,
        "status": meeting.status,
        "requires_passcode": bool(meeting.passcode)
    }

@app.get("/api/meetings/{meeting_identifier}", response_model=schemas.MeetingResponse)
def get_meeting_by_identifier(meeting_identifier: str, db: Session = Depends(get_db)):
    cleaned_identifier = meeting_identifier.replace("-", "").replace(" ", "").strip()
    meeting = (
        db.query(models.Meeting)
        .filter(
            or_(
                models.Meeting.id == meeting_identifier.strip(),
                models.Meeting.meeting_number == cleaned_identifier
            )
        )
        .first()
    )

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    return meeting

@app.delete("/api/meetings/{meeting_id}")
def delete_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    db.delete(meeting)
    db.commit()
    return {"success": True, "message": "Meeting deleted"}

@app.get("/api/meetings/{meeting_id}/messages", response_model=List[schemas.MessageResponse])
def get_meeting_messages(meeting_id: str, db: Session = Depends(get_db)):
    return (
        db.query(models.MeetingMessage)
        .filter(models.MeetingMessage.meeting_id == meeting_id)
        .order_by(models.MeetingMessage.created_at.asc())
        .all()
    )

@app.websocket("/ws/{meeting_id}/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    meeting_id: str,
    client_id: str,
    user_name: str = Query("Guest"),
    role: str = Query("participant"),
    is_muted: bool = Query(False),
    is_camera_off: bool = Query(False)
):
    user_info = {
        "user_id": client_id,
        "user_name": user_name,
        "role": role,
        "is_muted": is_muted,
        "is_camera_off": is_camera_off
    }
    
    await manager.connect(meeting_id, client_id, websocket, user_info)
    try:
        while True:
            raw_data = await websocket.receive_text()
            await manager.handle_message(meeting_id, client_id, raw_data)
    except WebSocketDisconnect:
        await manager.disconnect(meeting_id, client_id)
    except Exception:
        await manager.disconnect(meeting_id, client_id)
