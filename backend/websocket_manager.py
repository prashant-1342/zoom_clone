from typing import Dict, List, Any
import json
from fastapi import WebSocket
from database import SessionLocal
from models import MeetingParticipant, MeetingMessage

class RoomConnectionManager:
    def __init__(self):
        self.active_rooms: Dict[str, Dict[str, Dict[str, Any]]] = {}

    async def connect(self, meeting_id: str, client_id: str, websocket: WebSocket, user_info: Dict[str, Any]):
        await websocket.accept()
        if meeting_id not in self.active_rooms:
            self.active_rooms[meeting_id] = {}

        self.active_rooms[meeting_id][client_id] = {
            "websocket": websocket,
            "user_id": user_info.get("user_id", client_id),
            "user_name": user_info.get("user_name", "Guest"),
            "role": user_info.get("role", "participant"),
            "is_muted": user_info.get("is_muted", False),
            "is_camera_off": user_info.get("is_camera_off", False),
            "is_screen_sharing": False,
            "raised_hand": False
        }

        participants = self.get_room_participants_summary(meeting_id)
        
        await self.broadcast_to_room(meeting_id, {
            "type": "user_joined",
            "participant": {
                "client_id": client_id,
                **self.active_rooms[meeting_id][client_id]
            },
            "participants": participants
        }, exclude_client=client_id)

        await websocket.send_text(json.dumps({
            "type": "room_state",
            "client_id": client_id,
            "participants": participants
        }, default=str))

    async def disconnect(self, meeting_id: str, client_id: str):
        if meeting_id in self.active_rooms and client_id in self.active_rooms[meeting_id]:
            user_data = self.active_rooms[meeting_id].pop(client_id)
            
            if not self.active_rooms[meeting_id]:
                del self.active_rooms[meeting_id]
            else:
                participants = self.get_room_participants_summary(meeting_id)
                await self.broadcast_to_room(meeting_id, {
                    "type": "user_left",
                    "client_id": client_id,
                    "user_name": user_data["user_name"],
                    "participants": participants
                })

    def get_room_participants_summary(self, meeting_id: str) -> List[Dict[str, Any]]:
        if meeting_id not in self.active_rooms:
            return []
        
        summary = []
        for cid, data in self.active_rooms[meeting_id].items():
            summary.append({
                "client_id": cid,
                "user_id": data["user_id"],
                "user_name": data["user_name"],
                "role": data["role"],
                "is_muted": data["is_muted"],
                "is_camera_off": data["is_camera_off"],
                "is_screen_sharing": data["is_screen_sharing"],
                "raised_hand": data["raised_hand"]
            })
        return summary

    async def send_personal_message(self, meeting_id: str, target_client_id: str, message: Dict[str, Any]):
        if meeting_id in self.active_rooms and target_client_id in self.active_rooms[meeting_id]:
            ws = self.active_rooms[meeting_id][target_client_id]["websocket"]
            await ws.send_text(json.dumps(message, default=str))

    async def broadcast_to_room(self, meeting_id: str, message: Dict[str, Any], exclude_client: str = None):
        if meeting_id not in self.active_rooms:
            return

        payload = json.dumps(message, default=str)
        for cid, data in list(self.active_rooms[meeting_id].items()):
            if exclude_client and cid == exclude_client:
                continue
            try:
                await data["websocket"].send_text(payload)
            except Exception:
                pass

    async def handle_message(self, meeting_id: str, sender_client_id: str, raw_data: str):
        try:
            data = json.loads(raw_data)
            msg_type = data.get("type")

            if msg_type in ["offer", "answer", "ice_candidate"]:
                target_id = data.get("target_client_id")
                if target_id:
                    forward_payload = {
                        "type": msg_type,
                        "sender_client_id": sender_client_id,
                        "data": data.get("data")
                    }
                    await self.send_personal_message(meeting_id, target_id, forward_payload)

            elif msg_type == "chat_message":
                text = data.get("text", "").strip()
                if text and meeting_id in self.active_rooms and sender_client_id in self.active_rooms[meeting_id]:
                    sender = self.active_rooms[meeting_id][sender_client_id]
                    
                    db = SessionLocal()
                    try:
                        chat_record = MeetingMessage(
                            meeting_id=meeting_id,
                            sender_name=sender["user_name"],
                            sender_id=sender_client_id,
                            text=text
                        )
                        db.add(chat_record)
                        db.commit()
                        db.refresh(chat_record)
                        
                        chat_payload = {
                            "type": "chat_message",
                            "message": {
                                "id": chat_record.id,
                                "sender_name": chat_record.sender_name,
                                "sender_id": chat_record.sender_id,
                                "text": chat_record.text,
                                "created_at": chat_record.created_at.isoformat()
                            }
                        }
                        await self.broadcast_to_room(meeting_id, chat_payload)
                    finally:
                        db.close()

            elif msg_type == "media_state_change":
                if meeting_id in self.active_rooms and sender_client_id in self.active_rooms[meeting_id]:
                    sender = self.active_rooms[meeting_id][sender_client_id]
                    if "is_muted" in data:
                        sender["is_muted"] = data["is_muted"]
                    if "is_camera_off" in data:
                        sender["is_camera_off"] = data["is_camera_off"]
                    if "is_screen_sharing" in data:
                        sender["is_screen_sharing"] = data["is_screen_sharing"]
                    
                    await self.broadcast_to_room(meeting_id, {
                        "type": "participant_media_updated",
                        "client_id": sender_client_id,
                        "is_muted": sender["is_muted"],
                        "is_camera_off": sender["is_camera_off"],
                        "is_screen_sharing": sender["is_screen_sharing"]
                    })

            elif msg_type == "reaction":
                emoji = data.get("emoji")
                if emoji and meeting_id in self.active_rooms and sender_client_id in self.active_rooms[meeting_id]:
                    sender = self.active_rooms[meeting_id][sender_client_id]
                    await self.broadcast_to_room(meeting_id, {
                        "type": "reaction_received",
                        "client_id": sender_client_id,
                        "user_name": sender["user_name"],
                        "emoji": emoji
                    })

            elif msg_type == "toggle_hand":
                if meeting_id in self.active_rooms and sender_client_id in self.active_rooms[meeting_id]:
                    sender = self.active_rooms[meeting_id][sender_client_id]
                    sender["raised_hand"] = not sender["raised_hand"]
                    await self.broadcast_to_room(meeting_id, {
                        "type": "hand_state_updated",
                        "client_id": sender_client_id,
                        "user_name": sender["user_name"],
                        "raised_hand": sender["raised_hand"]
                    })

            elif msg_type == "host_control":
                action = data.get("action")
                target_client = data.get("target_client_id")
                
                if meeting_id in self.active_rooms and sender_client_id in self.active_rooms[meeting_id]:
                    sender = self.active_rooms[meeting_id][sender_client_id]
                    if sender["role"] == "host":
                        if action == "mute_all":
                            for cid, participant in self.active_rooms[meeting_id].items():
                                if cid != sender_client_id:
                                    participant["is_muted"] = True
                            await self.broadcast_to_room(meeting_id, {
                                "type": "force_mute_all",
                                "initiated_by": sender["user_name"]
                            })

                        elif action == "mute_participant" and target_client in self.active_rooms[meeting_id]:
                            self.active_rooms[meeting_id][target_client]["is_muted"] = True
                            await self.send_personal_message(meeting_id, target_client, {
                                "type": "force_mute",
                                "initiated_by": sender["user_name"]
                            })
                            await self.broadcast_to_room(meeting_id, {
                                "type": "participant_media_updated",
                                "client_id": target_client,
                                "is_muted": True,
                                "is_camera_off": self.active_rooms[meeting_id][target_client]["is_camera_off"],
                                "is_screen_sharing": self.active_rooms[meeting_id][target_client]["is_screen_sharing"]
                            })

                        elif action == "remove_participant" and target_client in self.active_rooms[meeting_id]:
                            await self.send_personal_message(meeting_id, target_client, {
                                "type": "kicked_from_meeting",
                                "reason": "Removed by host"
                            })

                        elif action == "end_meeting_for_all":
                            await self.broadcast_to_room(meeting_id, {
                                "type": "meeting_ended_by_host"
                            })

        except Exception as e:
            pass

manager = RoomConnectionManager()
