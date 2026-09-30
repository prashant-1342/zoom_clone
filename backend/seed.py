import random
from datetime import datetime, timedelta
from database import SessionLocal, Base, engine
from models import User, Meeting, MeetingParticipant, MeetingMessage

def generate_meeting_number():
    part1 = random.randint(100, 999)
    part2 = random.randint(100, 999)
    part3 = random.randint(1000, 9999)
    return f"{part1}{part2}{part3}"

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        user = db.query(User).filter(User.email == "alex.morgan@zoomflow.internal").first()
        if not user:
            user = User(
                name="Alex Morgan",
                email="alex.morgan@zoomflow.internal",
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                role="Engineering Lead"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        existing_meetings = db.query(Meeting).count()
        if existing_meetings == 0:
            now = datetime.utcnow()

            upcoming_samples = [
                {
                    "topic": "Frontend Architecture Review & Zoom UI Sync",
                    "description": "Weekly deep dive into Next.js components, WebRTC signaling performance, and user interface responsiveness.",
                    "start_time": now + timedelta(hours=2),
                    "duration_minutes": 45,
                    "passcode": "489201",
                    "meeting_type": "scheduled",
                    "status": "upcoming"
                },
                {
                    "topic": "Product Demo: Real-time Audio/Video Collaboration",
                    "description": "Live walkthrough of participant tile rendering, active speaker switching, and screen sharing features.",
                    "start_time": now + timedelta(days=1, hours=4),
                    "duration_minutes": 30,
                    "passcode": "773104",
                    "meeting_type": "scheduled",
                    "status": "upcoming"
                },
                {
                    "topic": "Sprint Planning & Backlog Grooming",
                    "description": "Bi-weekly sprint planning session for upcoming media engine and host controls enhancements.",
                    "start_time": now + timedelta(days=2, hours=1),
                    "duration_minutes": 60,
                    "passcode": "512998",
                    "meeting_type": "scheduled",
                    "status": "upcoming"
                }
            ]

            recent_samples = [
                {
                    "topic": "Design System Alignment & Token Standardization",
                    "description": "Reviewing Zoom dark theme palette, control bar ergonomics, and modal dialog polish.",
                    "start_time": now - timedelta(days=1, hours=3),
                    "duration_minutes": 40,
                    "passcode": "194022",
                    "meeting_type": "scheduled",
                    "status": "ended"
                },
                {
                    "topic": "Quick Standup & Daily Sync",
                    "description": "Daily standup meeting to coordinate blocker resolution and feature branch merges.",
                    "start_time": now - timedelta(days=2, hours=5),
                    "duration_minutes": 15,
                    "passcode": "820311",
                    "meeting_type": "instant",
                    "status": "ended"
                },
                {
                    "topic": "1-on-1 Engineering Check-in",
                    "description": "Monthly one-on-one meeting to discuss goals, code quality, and platform roadmap.",
                    "start_time": now - timedelta(days=3, hours=2),
                    "duration_minutes": 30,
                    "passcode": "339102",
                    "meeting_type": "scheduled",
                    "status": "ended"
                }
            ]

            for item in upcoming_samples:
                meeting = Meeting(
                    meeting_number=generate_meeting_number(),
                    topic=item["topic"],
                    description=item["description"],
                    passcode=item["passcode"],
                    host_id=user.id,
                    meeting_type=item["meeting_type"],
                    status=item["status"],
                    start_time=item["start_time"],
                    duration_minutes=item["duration_minutes"]
                )
                db.add(meeting)

            for item in recent_samples:
                meeting = Meeting(
                    meeting_number=generate_meeting_number(),
                    topic=item["topic"],
                    description=item["description"],
                    passcode=item["passcode"],
                    host_id=user.id,
                    meeting_type=item["meeting_type"],
                    status=item["status"],
                    start_time=item["start_time"],
                    duration_minutes=item["duration_minutes"]
                )
                db.add(meeting)
                db.flush()

                p1 = MeetingParticipant(
                    meeting_id=meeting.id,
                    user_name="Alex Morgan",
                    role="host",
                    joined_at=item["start_time"],
                    left_at=item["start_time"] + timedelta(minutes=item["duration_minutes"])
                )
                p2 = MeetingParticipant(
                    meeting_id=meeting.id,
                    user_name="Sarah Chen",
                    role="participant",
                    joined_at=item["start_time"] + timedelta(minutes=1),
                    left_at=item["start_time"] + timedelta(minutes=item["duration_minutes"])
                )
                db.add_all([p1, p2])

            db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
