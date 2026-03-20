export type CartItem = {
  productId: string;
  quantity: number;
};

export type InventorioProducto = {
  id?: string;
  name: string;
  price?: number;
  description?: string;
  stock?: number;
};

export type FeedbackState = {
  type: "success" | "error";
  message: string;
};
