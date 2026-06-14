import os
import base64
import httpx
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class MpesaClient:
    def __init__(self):
        self.consumer_key = os.getenv("MPESA_CONSUMER_KEY")
        self.consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")
        self.shortcode = os.getenv("MPESA_SHORTCODE")
        self.passkey = os.getenv("MPESA_PASSKEY")
        self.callback_url = os.getenv("MPESA_CALLBACK_URL")
        
        env = os.getenv("MPESA_ENVIRONMENT", "sandbox")
        self.base_url = "https://sandbox.safaricom.co.ke" if env == "sandbox" else "https://api.safaricom.co.ke"

    async def get_access_token(self) -> str:
        """Retrieves Daraja API OAuth access token."""
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        
        # Safaricom requires Basic Auth for OAuth: Base64(ConsumerKey:ConsumerSecret)
        credentials = f"{self.consumer_key}:{self.consumer_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            return data["access_token"]

    async def initiate_stk_push(self, phone_number: str, amount: int, account_reference: str, transaction_desc: str) -> dict:
        """Initiates an STK push (Lipa Na M-Pesa Online) to the customer."""
        access_token = await self.get_access_token()
        
        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        password_str = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode()
        
        # Format phone number: Safaricom requires 254XXXXXXXXX
        if phone_number.startswith("0"):
            phone_number = "254" + phone_number[1:]
        elif phone_number.startswith("+"):
            phone_number = phone_number[1:]
            
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone_number,
            "PartyB": self.shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": self.callback_url,
            "AccountReference": account_reference[:12], # Max 12 chars
            "TransactionDesc": transaction_desc
        }
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()

    async def check_stk_status(self, checkout_request_id: str) -> dict:
        """Queries the Safaricom Daraja API for the status of an STK push."""
        access_token = await self.get_access_token()
        
        url = f"{self.base_url}/mpesa/stkpushquery/v1/query"
        
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        password_str = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode()
        
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "CheckoutRequestID": checkout_request_id
        }
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            return response.json()
