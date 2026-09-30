from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class UserBase(BaseModel):
    name: str
    email: str
    avatar_url: Optional[str] = None
    role: Optional[str] = "member"

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class MeetingCreateInstant(BaseModel):
    topic: Optional[str] = "Instant Meeting"
    host_name: Optional[str] = "Alex Morgan"
    passcode: Optional[str] = None

class MeetingScheduleCreate(BaseModel):
    topic: str = Field(..., min_length=1)
    description: Optional[str] = None
    start_time: datetime
    duration_minutes: int = 30
    passcode: Optional[str] = None
    host_name: Optional[str] = "Alex Morgan"

class MeetingJoinValidate(BaseModel):
    meeting_identifier: str
    passcode: Optional[str] = None
    user_name: str

class ParticipantResponse(BaseModel):
    id: str
    meeting_id: str
    user_name: str
    role: str
    is_muted: bool
    is_camera_off: bool
    joined_at: datetime

    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: str
    meeting_id: str
    sender_name: str
    sender_id: str
    text: str
    created_at: datetime

    class Config:
        from_attributes = True

class MeetingResponse(BaseModel):
    id: str
    meeting_number: str
    topic: str
    description: Optional[str] = None
    passcode: Optional[str] = None
    meeting_type: str
    status: str
    start_time: Optional[datetime] = None
    duration_minutes: int
    created_at: datetime
    host: Optional[UserResponse] = None
    participants_count: Optional[int] = 0

    class Config:
        from_attributes = True

class DashboardSummaryResponse(BaseModel):
    user: UserResponse
    upcoming_meetings: List[MeetingResponse]
    recent_meetings: List[MeetingResponse]
