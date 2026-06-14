export interface Product {
  id?: string;
  name: string;
  price: number;
  weight_kg: number;
  stock?: number;
  category_id?: string;
  description?: string;
  chatText?: string;
}

export interface Category {
  id: string;
  name: string;
}
