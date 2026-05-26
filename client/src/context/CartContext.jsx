import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

const normalizeItems = (items) => (Array.isArray(items) ? items : [])
  .filter((item) => item?.eventId && item?.ticketTypeId)
  .slice(0, 1)
  .map((item) => ({ ...item, quantity: 1 }));

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    const raw = localStorage.getItem('eventsphere_cart');
    if (!raw) return [];
    try {
      return normalizeItems(JSON.parse(raw));
    } catch {
      return [];
    }
  });

  const persist = (next) => {
    const normalized = normalizeItems(next);
    setItems(normalized);
    localStorage.setItem('eventsphere_cart', JSON.stringify(normalized));
  };

  const addToCart = (event, ticketType) => {
    persist([{
      eventId: event._id,
      eventTitle: event.title,
      ticketTypeId: ticketType._id,
      name: ticketType.name,
      price: ticketType.isFree ? 0 : ticketType.price,
      quantity: 1
    }]);
  };

  const updateQuantity = (ticketTypeId) => {
    const next = items
      .map((item) => item.ticketTypeId === ticketTypeId ? { ...item, quantity: 1 } : item)
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
