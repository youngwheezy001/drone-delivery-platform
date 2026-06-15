export const MOCK_HUBS = [
  {
    id: "MOCK_HUB_1",
    name: "TUSTAR CENTRAL HUB",
    company_id: "TUSTAR_HQ",
    region: "NAIROBI_CENTRAL",
    products: [
      { id: "p1", name: "Tactical Pizza", description: "Large Pepperoni", price: 1500, weight_kg: 0.8, image_url: "pizza", category: { name: "food" } },
      { id: "p2", name: "Water Supply", description: "Fresh Spring Water", price: 200, weight_kg: 1.0, image_url: "water", category: { name: "food" } },
      { id: "p3", name: "Drone Batteries", description: "High-cap Battery", price: 4500, weight_kg: 0.5, image_url: "battery", category: { name: "electronics" } },
      { id: "p4", name: "Burger Combo", description: "Double Beef Burger", price: 1200, weight_kg: 0.6, image_url: "burger", category: { name: "food" } }
    ]
  },
  {
    id: "MOCK_HUB_2",
    name: "MEGASCRIPT LOGISTICS",
    company_id: "MEGASCRIPT_HUB",
    region: "NAIROBI_WEST",
    products: [
      { id: "p5", name: "First Aid Kit", description: "Tactical Tourniquet & Bandages", price: 3500, weight_kg: 0.4, image_url: "medicine", category: { name: "medicine" } },
      { id: "p6", name: "Soda Crate", description: "Ice Cold Cokes", price: 800, weight_kg: 2.5, image_url: "soda", category: { name: "food" } },
      { id: "p7", name: "Thermal Blanket", description: "Emergency Blanket", price: 1500, weight_kg: 0.2, image_url: "thermal_blanket", category: { name: "medicine" } },
      { id: "p8", name: "Ration Pack", description: "MRE Rations", price: 2000, weight_kg: 1.2, image_url: "ration_pack", category: { name: "food" } }
    ]
  }
];
