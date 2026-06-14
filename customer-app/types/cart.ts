export interface CartItem {
  id: string;
  name: string;
  price: number;
  weight: number;
}

export interface CartEntry {
  item: CartItem;
  qty: number;
}
