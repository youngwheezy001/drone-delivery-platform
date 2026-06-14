import asyncio
from sqlalchemy import text
from app.models.database import AsyncSessionLocal
import urllib.parse

def get_keywords_for_product(name: str) -> str:
    n = name.lower()
    
    # Medical
    if "blood" in n: return "blood,transfusion"
    if "insulin" in n: return "insulin,vial"
    if "venom" in n or "antivenom" in n: return "antivenom,vial"
    if "first aid" in n or "kit" in n: return "first,aid,kit"
    if "antibiotic" in n or "amoxicillin" in n: return "antibiotics,pills"
    if "gauze" in n or "bandage" in n: return "bandage,medical"
    if "defibrillator" in n or "aed" in n: return "defibrillator"
    if "epipen" in n or "epinephrine" in n: return "epipen,syringe"
    if "inhaler" in n: return "inhaler,asthma"
    if "oxygen" in n: return "oxygen,tank"
    if "surgical" in n or "scalpel" in n: return "surgical,tools"
    if "thermometer" in n: return "medical,thermometer"
    
    # Food & Drink
    if "pizza" in n:
        if "pepperoni" in n: return "pepperoni,pizza"
        if "margherita" in n: return "margherita,pizza"
        if "hawaiian" in n: return "hawaiian,pizza"
        if "veg" in n or "vegan" in n: return "vegan,pizza"
        return "pizza"
    if "burger" in n:
        if "cheese" in n: return "cheeseburger"
        if "chicken" in n: return "chicken,burger"
        if "vegan" in n or "beyond" in n: return "vegan,burger"
        return "burger"
    if "fries" in n: return "french,fries"
    if "salad" in n: return "salad,bowl"
    if "coke" in n or "soda" in n or "pepsi" in n: return "coca,cola,can"
    if "water" in n: return "water,bottle"
    if "cake" in n: return "chocolate,cake"
    if "ice cream" in n: return "ice,cream"
    
    # Electronics
    if "drone" in n: return "drone,dji"
    if "battery" in n: return "lithium,battery"
    if "cable" in n or "usb" in n: return "usb,cable"
    if "charger" in n: return "charger,adapter"
    if "sensor" in n: return "electronic,sensor"
    if "controller" in n: return "remote,controller"
    if "camera" in n: return "lens,camera"
    if "gps" in n: return "gps,module"
    
    # Industrial & Hardware
    if "oil" in n or "lubricant" in n: return "machine,oil"
    if "wrench" in n or "spanner" in n: return "wrench,tool"
    if "drill" in n: return "power,drill"
    if "saw" in n: return "circular,saw"
    if "hammer" in n: return "hammer,tool"
    if "screws" in n or "nails" in n: return "screws,hardware"
    if "gear" in n: return "metal,gears"
    if "motor" in n: return "electric,motor"
    if "tape" in n: return "duct,tape"
    
    # Fallbacks based on category/words
    words = n.replace("-", " ").split(" ")
    clean_words = [w for w in words if len(w) > 3]
    if clean_words:
        return ",".join(clean_words[:2])
    
    return "box,package"

async def fix_images_accurate():
    async with AsyncSessionLocal() as db:
        result = await db.execute(text("SELECT id, name FROM products"))
        products = result.mappings().all()
        
        for p in products:
            keywords = get_keywords_for_product(p["name"])
            # use image.pollinations.ai because it generates exactly what is prompted!
            # or loremflickr. loremflickr is more realistic for physical items.
            # actually, pollinations.ai/prompt/{prompt} is an AI generator that guarantees exact match!
            # The user wants exact matches: "machine oil, cutting material... need to be matching with their images"
            # Pollinations.ai is 100% free, no API key, returns an image directly.
            prompt = urllib.parse.quote(f"A professional product photo of {p['name']}, high quality, white background")
            new_url = f"https://image.pollinations.ai/prompt/{prompt}?width=600&height=400&nologo=true"
            
            await db.execute(text("UPDATE products SET image_url = :url WHERE id = :pid"), 
                             {"url": new_url, "pid": p["id"]})
            
        await db.commit()
        print(f"Updated {len(products)} products with highly accurate AI-generated images.")

if __name__ == "__main__":
    asyncio.run(fix_images_accurate())
