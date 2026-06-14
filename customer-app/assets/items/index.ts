export const localImages: { [key: string]: any } = {
  "ar_15_tactical_tourniquet": require('./ar_15_tactical_tourniquet.jpg'),
  "o_negative_blood": require('./o_negative_blood.jpg'),
  "ration_pack": require('./ration_pack.jpg'),
  "emergency_radio": require('./emergency_radio.jpg'),
  "thermal_blanket": require('./thermal_blanket.jpg'),
  "geiger_counter": require('./geiger_counter.jpg'),
  "paracord": require('./paracord.jpg'),
  "iodine_tablets": require('./iodine_tablets.jpg'),
  "pizza": require('./pizza.jpg'),
  "burger": require('./burger.jpg'),
  "coke": require('./coke.jpg'),
  "soda": require('./soda.jpg'),
  "medicine": require('./medicine.jpg')
};

export function getLocalImage(name: string) {
  if (!name) return null;
  const key = name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  
  // Find a matching key if the exact key doesn't exist
  for (const k in localImages) {
    if (key.includes(k) || k.includes(key)) {
      return localImages[k];
    }
  }
  
  return null;
}
