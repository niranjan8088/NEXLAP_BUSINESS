import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
  variantId?: string;
  variantSku?: string;
  variantName?: string;
}

interface CartStore {
  items: CartItem[];
  appliedOfferCode: string;
  isOpen: boolean;
  setAppliedOfferCode: (code: string) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: {
    id: string;
    title: string;
    price: number;
    image: string;
    category?: string;
    variantId?: string;
    variantSku?: string;
    variantName?: string;
  }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      appliedOfferCode: "",
      isOpen: false,

      setAppliedOfferCode: (code) => set({ appliedOfferCode: code.trim().toUpperCase() }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (product) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.productId === product.id && item.variantId === product.variantId
          );
          if (existingIndex > -1) {
            const updated = [...state.items];
            updated[existingIndex].quantity += 1;
            return { items: updated, isOpen: true };
          } else {
            const newItem: CartItem = {
              id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              productId: product.id,
              title: product.title,
              price: Number(product.price) || 0,
              image: product.image || "/images/poster-products.webp",
              category: product.category || "Hardware",
              quantity: 1,
              variantId: product.variantId,
              variantSku: product.variantSku,
              variantName: product.variantName,
            };
            return { items: [...state.items, newItem], isOpen: true };
          }
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [], appliedOfferCode: "" }),

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "nexbyte_cart_storage",
      partialize: (state) => ({
        items: state.items,
        appliedOfferCode: state.appliedOfferCode,
      }),
    }
  )
);
