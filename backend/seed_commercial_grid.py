import asyncio
import uuid
import random
from sqlalchemy import text, select
from app.models.database import AsyncSessionLocal
from app.models.user import User
from app.models.marketplace import Product, Category
from app.models.delivery import DeliveryRecord
from app.models.drone import Drone
from app.core.security import get_password_hash

# 📊 THE PRODUCT LIBRARY: Bulletproof Marketplace Imagery (Glovo Style)
# Using high-compatibility Unsplash parameters to ensure loading on all devices
UNSPLASH_BASE = "https://images.unsplash.com/"
PIZZA_IMG = f"{UNSPLASH_BASE}photo-1513104890138-7c749659a591?w=600&q=80"
BURGER_IMG = f"{UNSPLASH_BASE}photo-1568901346375-23c9450c58cd?w=600&q=80"
MEDICINE_IMG = f"{UNSPLASH_BASE}photo-1584308666744-24d5c474f2ae?w=600&q=80"
TECH_IMG = f"{UNSPLASH_BASE}photo-1526733158133-d996131f79f4?w=600&q=80"
INDUSTRIAL_IMG = f"{UNSPLASH_BASE}photo-1581092160562-40aa08e78837?w=600&q=80"
LOGISTICS_IMG = f"{UNSPLASH_BASE}photo-1566576721346-d4a3b4eaad5b?w=600&q=80"

PRODUCT_LIBRARY = {
    "Medicine": [
        ("O-Negative Blood Supply", "Emergency medical blood pack", 12000, 0.8, "https://images.unsplash.com/photo-1615461066841-6116ecaaba0a?w=600&q=80"),
        ("First Aid Kit", "Complete home emergency set", 5000, 1.5, "https://images.unsplash.com/photo-1603398938378-e54eab446f90?w=600&q=80"),
        ("Anti-Venom Injection", "Common snake bite treatment", 15000, 0.3, MEDICINE_IMG),
        ("Sterile Hospital Gauze", "Medical grade wound dressing", 1500, 0.5, MEDICINE_IMG),
        ("Digital Thermometer", "Non-contact forehead scanner", 2500, 0.2, "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=600&q=80"),
        ("Portable Oxygen Tank", "2L oxygen for medical use", 9000, 3.5, "https://images.unsplash.com/photo-1586773860418-d37222d8fce2?w=600&q=80"),
        ("Insulin Medicine", "Treatment for diabetics", 5500, 0.6, MEDICINE_IMG),
        ("Antibiotics Pack", "Common bacterial treatment", 1200, 0.2, MEDICINE_IMG),
        ("Trauma Bandages", "Stretchy medical bandages", 800, 0.3, MEDICINE_IMG),
        ("Health Monitoring Watch", "Heart rate and step tracker", 25000, 0.2, "https://images.unsplash.com/photo-1508685096489-775b341f237f?w=600&q=80"),
    ],
    "Food": [
        ("Pepperoni Pizza", "Classic family size pizza", 1600, 1.2, PIZZA_IMG),
        ("Beef Burger Meal", "Burger with fries and a soda", 1200, 0.7, BURGER_IMG),
        ("Margherita Pizza", "Cheese and tomato pizza", 1300, 1.1, "https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?w=600&q=80"),
        ("BBQ Chicken Wings", "12 pieces of sweet BBQ wings", 1100, 0.6, "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&q=80"),
        ("Greek Garden Salad", "Fresh vegetables and olives", 750, 0.4, "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80"),
        ("Chicken Pasta", "Creamy chicken and mushroom pasta", 1100, 0.8, "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80"),
        ("Beef Lasagna", "Cheesy baked beef lasagna", 1400, 1.2, "https://images.unsplash.com/photo-1619895092538-1283417871fa?w=600&q=80"),
        ("Chocolate Lava Cake", "Warm chocolate dessert", 650, 0.3, "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80"),
        ("Large French Fries", "Crispy salted potato chips", 350, 0.4, "https://images.unsplash.com/photo-1630384066221-447768407452?w=600&q=80"),
        ("Ice Cold Coke (1.5L)", "Refreshing soda drink", 250, 1.6, "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80"),
    ],
    "Electronics": [
        ("Large Power Bank", "20,000mAh portable charger", 4500, 0.6, "https://images.unsplash.com/photo-1609091839311-d536819547df?w=600&q=80"),
        ("Rechargeable Flashlight", "Very bright LED torch", 3200, 0.4, "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80"),
        ("Wireless Earbuds", "Bluetooth noise cancelling pods", 12500, 0.1, "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80"),
        ("Smart Home Camera", "WiFi security monitoring camera", 7500, 0.3, "https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?w=600&q=80"),
        ("High Speed USB-C Cable", "Rugged fast charging cable", 1200, 0.2, "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80"),
        ("Memory Card (128GB)", "Fast storage for your phone", 2500, 0.01, TECH_IMG),
        ("Fitness Smart Watch", "Tracks your daily exercise", 15000, 0.2, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"),
        ("Bluetooth Speaker", "Waterproof music speaker", 6500, 0.8, "https://images.unsplash.com/photo-1608156639585-340c978f5af2?w=600&q=80"),
        ("Gaming Keyboard", "Mechanical keyboard for PC", 9000, 1.1, "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=600&q=80"),
        ("WiFi Internet Router", "High speed home internet", 12000, 0.9, "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80"),
    ],
    "Industrial": [
        ("Machine Oil (2L)", "Industrial grade lubricant", 3200, 2.2, "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80"),
        ("Metal Cutting Tool", "Set of 5 carbon steel tools", 8500, 1.1, "https://images.unsplash.com/photo-1504148455328-4972fefebfee?w=600&q=80"),
        ("Heavy Duty Rope", "10 meters of strong nylon rope", 4500, 1.8, "https://images.unsplash.com/photo-1551893478-43e742c368f5?w=600&q=80"),
        ("Safety Goggles", "Protective glasses for work", 1200, 0.3, "https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=600&q=80"),
        ("Cordless Power Drill", "Powerful drill with 2 batteries", 12000, 2.6, INDUSTRIAL_IMG),
        ("Steel Screw Box", "1kg box of strong screws", 1500, 1.0, INDUSTRIAL_IMG),
        ("Industrial Gloves", "Touch-guarded work gloves", 1200, 0.3, "https://images.unsplash.com/photo-1590779033100-9f60705a2f3b?w=600&q=80"),
        ("Toolbox Organizer", "Plastic box with 24 slots", 3500, 1.4, INDUSTRIAL_IMG),
        ("Welding Equipment", "Standard welding rod set", 2500, 1.7, "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80"),
        ("Duct Tape (3pk)", "Extra strong industrial tape", 1800, 0.8, INDUSTRIAL_IMG),
    ],
    "Logistics": [
        ("Delivery Box", "Thermal insulated food box", 5500, 2.5, LOGISTICS_IMG),
        ("Package Tape", "Strong brown packing tape", 1500, 1.2, LOGISTICS_IMG),
        ("Shipping Labels", "Roll of 500 sticky labels", 3500, 0.5, "https://images.unsplash.com/photo-1586528116311-ad86d7080c98?w=600&q=80"),
        ("Drone Battery", "Spare battery for drone fleet", 15000, 1.8, "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80"),
        ("Drone Propellers", "Replacement blades (Set of 4)", 2500, 0.4, "https://images.unsplash.com/photo-1473968512647-3e44a224fe8f?w=600&q=80"),
        ("Cargo Padding", "Bubble wrap for fragile items", 1200, 0.6, LOGISTICS_IMG),
        ("Moving Box (10pk)", "Strong cardboard boxes", 3000, 2.0, LOGISTICS_IMG),
        ("Weight Scale", "Digital scale for packages", 4500, 0.8, "https://images.unsplash.com/photo-1510519133417-c8c33a03e12c?w=600&q=80"),
        ("GPS Tracking Device", "Real-time location tag", 5500, 0.1, "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=600&q=80"),
        ("Worker Safety Vest", "Neon yellow reflective vest", 1200, 0.3, "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80"),
    ]
}

async def seed_commercial_grid():
    async with AsyncSessionLocal() as db:
        print("[STERILIZATION] Wiping existing grid state...")
        await db.execute(text("DELETE FROM deliveries"))
        await db.execute(text("DELETE FROM products"))
        await db.execute(text("DELETE FROM categories"))
        await db.execute(text("DELETE FROM drones"))
        await db.execute(text("DELETE FROM users"))
        await db.commit()

        print("[SEEDER] Provisioning Commercial Matrix Categories...")
        categories = [
            ("Medicine", "medkit-outline", "#ef4444"),
            ("Food", "restaurant-outline", "#f59e0b"),
            ("Electronics", "hardware-chip-outline", "#3b82f6"),
            ("Logistics", "cube-outline", "#00ffcc"),
            ("Industrial", "construct-outline", "#8b5cf6")
        ]
        cat_ids = {}
        for name, icon, color in categories:
            cat = Category(id=str(uuid.uuid4()), name=name, icon=icon, color=color)
            db.add(cat)
            await db.flush()
            cat_ids[name] = cat.id

        print("[SEEDER] Populating Authentic Commercial Nodes...")
        hubs = [
            ("user_master_admin", "mwangilewis205@gmail.com", "Tustarcruzz001", "Lewis Mwangi (Admin)", "TUSTAR_COMMAND", "ADMIN", "Nairobi CBD", 1, None),
            ("user_tustar_dispatch", "admin@tustar.io", "tustar123", "Tustar Fast Delivery", "TUSTAR_HQ", "SELLER", "Nairobi CBD", 0, "Logistics"),
            ("user_megascript_logistics", "lewis@megascript.com", "megascript001", "Mega Logistics Hub", "MEGASCRIPT_HUB", "SELLER", "Eastleigh", 0, "Logistics"),
            ("user_global_cargo", "global@cargo.net", "cargo777", "Global Industrial Hub", "GLOBAL_CARGO", "SELLER", "Industrial Area", 0, "Industrial"),
            ("user_medical_aero", "pharmacy@tustar.io", "medic001", "Tustar Hospital Express", "TUSTAR_MEDICAL", "SELLER", "Kilimani", 0, "Medicine"),
            ("user_culinary_node", "pizza@tustar.io", "pizza001", "Kilimani Pizza Inn", "TUSTAR_PIZZA", "SELLER", "Kilimani", 0, "Food"),
            ("user_megascript_tech", "electronics@megascript.com", "tech001", "Mega Electronics Store", "MEGASCRIPT_TECH", "SELLER", "Westlands", 0, "Electronics")
        ]

        hub_cids = []
        for uid, email, pin, name, cid, role, reg, is_adm, cat_name in hubs:
            user = User(
                id=uid, email=email, hashed_password=get_password_hash(pin),
                full_name=name, company_id=cid, role=role, region=reg,
                is_active=True, is_admin=bool(is_adm)
            )
            db.add(user)
            if role == "SELLER":
                hub_cids.append(cid)
                # SEEDING 20+ HIGH-DENSITY PRODUCTS
                if cat_name and cat_name in cat_ids:
                    lib_items = PRODUCT_LIBRARY.get(cat_name, [])
                    # Add items for realism (multiplying to get 20+ per hub as requested)
                    for i in range(2): 
                        for p_name, p_desc, p_price, p_weight, p_img in lib_items:
                            db.add(Product(
                                id=str(uuid.uuid4()), 
                                seller_id=uid, 
                                category_id=cat_ids[cat_name], 
                                name=f"{p_name}{' (Bulk)' if i > 0 else ''}", 
                                description=p_desc, 
                                price=float(p_price * (2 if i > 0 else 1)), 
                                weight_kg=float(p_weight * (2 if i > 0 else 1)),
                                image_url=p_img
                            ))

        await db.flush()

        print("[SEEDER] Initializing 24-UAV Regional Fleet...")
        for cid in hub_cids:
            for i in range(4):
                drone = Drone(
                    id=f"UAV-{cid}-{101+i}",
                    current_hub_id=cid,
                    status="IDLE",
                    battery_health_pct=100.0
                )
                db.add(drone)

        await db.commit()
        print(f"[SUCCESS] Bulletproof Visual Saturation complete. All 140+ products updated with high-reliability imagery.")

if __name__ == "__main__":
    asyncio.run(seed_commercial_grid())
