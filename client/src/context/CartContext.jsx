import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    const raw = localStorage.getItem('eventsphere_cart');
    return raw ? JSON.parse(raw) : [];
  });

  const persist = (next) => {
    setItems(next);
    localStorage.setItem('eventsphere_cart', JSON.stringify(next));
  };

  const addToCart = (event, ticketType, quantity = 1) => {
    const next = items.length && items[0].eventId !== event._id ? [] : [...items];
    const existing = next.find((item) => item.ticketTypeId === ticketType._id);
    if (existing) existing.quantity += quantity;
    else {
      next.push({
        eventId: event._id,
        eventTitle: event.title,
        ticketTypeId: ticketType._id,
        name: ticketType.name,
        price: ticketType.isFree ? 0 : ticketType.price,
        quantity
      });
    }
    persist(next);
  };

  const updateQuantity = (ticketTypeId, quantity) => {
    const next = items
      .map((item) => item.ticketTypeId === ticketTypeId ? { ...item, quantity: Math.max(1, quantity) } : item)
      .filter((item) => item.quantity > 0);
    persist(next);
  };

  const removeFromCart = (ticketTypeId) => persist(items.filter((item) => item.ticketTypeId !== ticketTypeId));
  const clearCart = () => persist([]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = useMemo(() => ({
    items,
    subtotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart
  }), [items, subtotal]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
