from PIL import Image, ImageDraw, ImageFont
import os

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
    filename = item.replace(" ", "_").replace("-", "_").lower() + ".jpg"
    filepath = os.path.join(dest_dir, filename)
    
    # Create a simple colored placeholder image
    img = Image.new('RGB', (400, 400), color = (30, 41, 59)) # Slate 800
    d = ImageDraw.Draw(img)
    
    # Try to use a font, fallback to default
    try:
        fnt = ImageFont.truetype("arial.ttf", 24)
    except:
        fnt = ImageFont.load_default()
        
    # Draw text in the middle
    d.text((20, 180), item, font=fnt, fill=(0, 255, 204)) # Neon cyan
    
    img.save(filepath)
    print(f"Generated {filepath}")

print("Done generating placeholder images.")
