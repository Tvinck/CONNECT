import { useState, useEffect } from 'react';
import type { CartItem } from '../types';

/**
 * Глобальное событие для синхронизации корзины между вкладками/компонентами.
 */
const CART_UPDATE_EVENT = 'bazzar_cart_updated';

/**
 * Хук для управления состоянием корзины через localStorage.
 * Синхронизирует данные между всеми компонентами на лету.
 */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  // Инициализация и подписка на изменения
  useEffect(() => {
    const loadCart = () => {
      const saved = localStorage.getItem('bazzar_cart');
      if (saved) {
        try {
          setItems(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse cart", e);
        }
      } else {
        setItems([]);
      }
    };

    loadCart();

    // Слушаем кастомное событие обновления корзины (внутри одной вкладки)
    window.addEventListener(CART_UPDATE_EVENT, loadCart);
    // Слушаем событие storage (изменения в других вкладках)
    window.addEventListener('storage', (e) => {
      if (e.key === 'bazzar_cart') loadCart();
    });

    return () => {
      window.removeEventListener(CART_UPDATE_EVENT, loadCart);
      window.removeEventListener('storage', loadCart);
    };
  }, []);

  /**
   * Обновляет корзину в state и localStorage, вызывает событие.
   */
  const updateCart = (newItems: CartItem[]) => {
    setItems(newItems);
    if (newItems.length > 0) {
      localStorage.setItem('bazzar_cart', JSON.stringify(newItems));
    } else {
      localStorage.removeItem('bazzar_cart');
    }
    window.dispatchEvent(new Event(CART_UPDATE_EVENT));
  };

  /**
   * Добавляет товар в корзину. Если товар уже есть, не меняет (или можно увеличивать qty).
   */
  const addItem = (item: CartItem) => {
    const existing = items.find(i => i.id === item.id);
    if (!existing) {
      updateCart([...items, item]);
    }
  };

  /**
   * Изменяет количество конкретного товара.
   */
  const setQty = (id: string, delta: number) => {
    updateCart(items.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  /**
   * Удаляет товар из корзины.
   */
  const removeItem = (id: string) => {
    updateCart(items.filter(i => i.id !== id));
  };

  /**
   * Полностью очищает корзину.
   */
  const clearCart = () => {
    updateCart([]);
  };

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  return { items, setQty, removeItem, clearCart, addItem, subtotal, cartCount: items.length };
}
