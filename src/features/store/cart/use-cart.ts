"use client";

import { useSyncExternalStore } from "react";
import { addCartId, cartServerSnapshot, cartSnapshot, clearCart, removeCartId, subscribeCart } from "./cart-store";

export function useCart() {
  const ids = useSyncExternalStore(subscribeCart, cartSnapshot, cartServerSnapshot);
  return {
    ids,
    count: ids.length,
    has: (productId: string) => ids.includes(productId),
    add: addCartId,
    remove: removeCartId,
    clear: clearCart,
  };
}
