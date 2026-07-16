"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

export type CartAddonSelection = {
  optionId: string;
  groupTitle: string;
  name: string;
  price: number;
  qty: number;
};

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  basePrice: number;
  quantity: number;
  addons: CartAddonSelection[];
  observation: string;
  imageUrl: string | null;
};

type CartState = { items: CartItem[]; hydrated: boolean };

type CartAction =
  | { type: "HYDRATE"; items: CartItem[] }
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "UPDATE_QTY"; id: string; quantity: number }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "CLEAR" };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.items, hydrated: true };
    case "ADD_ITEM":
      return { ...state, items: [...state.items, action.item] };
    case "UPDATE_QTY":
      return {
        ...state,
        items: state.items
          .map((item) =>
            item.id === action.id
              ? { ...item, quantity: action.quantity }
              : item
          )
          .filter((item) => item.quantity > 0),
      };
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.id),
      };
    case "CLEAR":
      return { ...state, items: [] };
    default:
      return state;
  }
}

export function cartItemUnitPrice(item: CartItem) {
  const addonsTotal = item.addons.reduce(
    (sum, addon) => sum + addon.price * addon.qty,
    0
  );
  return item.basePrice + addonsTotal;
}

export function cartItemTotal(item: CartItem) {
  return cartItemUnitPrice(item) * item.quantity;
}

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(slug: string) {
  return `cart:${slug}`;
}

export function CartProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, { items: [], hydrated: false });

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey(slug));
    dispatch({ type: "HYDRATE", items: raw ? JSON.parse(raw) : [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!state.hydrated) return;
    window.localStorage.setItem(storageKey(slug), JSON.stringify(state.items));
  }, [slug, state.items, state.hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    dispatch({
      type: "ADD_ITEM",
      item: { ...item, id: crypto.randomUUID() },
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: "UPDATE_QTY", id, quantity });
  }, []);

  const removeItem = useCallback((id: string) => {
    dispatch({ type: "REMOVE_ITEM", id });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const totalItems = useMemo(
    () => state.items.reduce((sum, item) => sum + item.quantity, 0),
    [state.items]
  );
  const totalPrice = useMemo(
    () => state.items.reduce((sum, item) => sum + cartItemTotal(item), 0),
    [state.items]
  );

  const value = useMemo(
    () => ({
      items: state.items,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      totalItems,
      totalPrice,
    }),
    [state.items, addItem, updateQuantity, removeItem, clear, totalItems, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
