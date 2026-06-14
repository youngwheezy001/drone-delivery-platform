import asyncio
import httpx

hubs = [
    ("mwangilewis205@gmail.com", "Tustarcruzz001", "Admin"),
    ("admin@tustar.io", "tustar123", "Main Logistics"),
    ("lewis@megascript.com", "megascript001", "Mega Logistics"),
    ("global@cargo.net", "cargo777", "Global Industrial"),
    ("pharmacy@tustar.io", "medic001", "Hospital Express"),
    ("pizza@tustar.io", "pizza001", "Pizza Inn"),
    ("electronics@megascript.com", "tech001", "Electronics Store")
]

async def test_logins():
    print('Testing logins against backend...')
    async with httpx.AsyncClient() as client:
        for email, password, name in hubs:
            try:
                response = await client.post(
                    'http://127.0.0.1:8000/api/v1/auth/login/access-token',
                    data={'username': email, 'password': password}
                )
                if response.status_code == 200:
                    print(f'[OK] {name} ({email}) - Successfully authenticated.')
                else:
                    print(f'[FAILED] {name} ({email}) - Status {response.status_code}: {response.text}')
            except Exception as e:
                print(f'[ERROR] {name} ({email}) - Connection error: {e}')

asyncio.run(test_logins())
