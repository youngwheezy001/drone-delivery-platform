import os
import urllib.request
import urllib.parse
import json

items = [
    "AR-15 TACTICAL TOURNIQUET",
    "O-NEGATIVE BLOOD",
    "RATION PACK",
    "EMERGENCY RADIO",
    "THERMAL BLANKET",
    "GEIGER COUNTER",
    "PARACORD",
    "IODINE TABLETS",
    "PIZZA",
    "BURGER",
    "COKE",
    "SODA",
    "MEDICINE"
]

dest_dir = "customer-app/assets/items"
os.makedirs(dest_dir, exist_ok=True)

for item in items:
    # We use pollinations to generate a reliable image for each item
    filename = item.replace(" ", "_").replace("-", "_").lower() + ".jpg"
    filepath = os.path.join(dest_dir, filename)
    if not os.path.exists(filepath):
        print(f"Downloading {item}...")
        prompt = urllib.parse.quote(f"A high quality professional photograph of {item}, isolated on a dark tactical background, hyper realistic 4k, studio lighting")
        url = f"https://image.pollinations.ai/prompt/{prompt}?width=400&height=400&nologo=true"
        try:
            urllib.request.urlretrieve(url, filepath)
        except Exception as e:
            print(f"Failed to download {item}: {e}")

print("Done downloading images.")
