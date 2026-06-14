import httpx
import logging

async def send_push_notification(expo_push_token: str, title: str, body: str):
    """
    Sends a live Push Notification to an Expo React Native client.
    """
    if not expo_push_token:
        return
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://exp.host/--/api/v2/push/send",
                json={
                    "to": expo_push_token,
                    "sound": "default",
                    "title": title,
                    "body": body,
                    "data": {"someData": "goes here"},
                },
                headers={
                    "Accept": "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                }
            )
            response.raise_for_status()
            logging.info(f"📲 [PUSH NOTIFICATION] Sent to {expo_push_token}: {title}")
    except Exception as e:
        logging.error(f"❌ [PUSH NOTIFICATION FAILED] {e}")
