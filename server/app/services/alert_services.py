import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

# Hardcode your phone number (or a judge's number if you ask them during the pitch)
TARGET_PHONE_NUMBER = "+919826128320" # Must include +91 for India

def send_emergency_sms(location_name: str, hazard_type: str, severity: int):
    if not TWILIO_ACCOUNT_SID: return
    
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    message_body = f"🚨 RAKSHAK CRITICAL ALERT: Level {severity} {hazard_type} detected near {location_name}. Avoid the area. Emergency routing activated."
    
    try:
        message = client.messages.create(
            body=message_body,
            from_=TWILIO_PHONE_NUMBER,
            to=TARGET_PHONE_NUMBER
        )
        print(f"📱 SMS Dispatched! Message SID: {message.sid}")
    except Exception as e:
        print(f"❌ SMS Failed: {e}")