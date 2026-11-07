import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/utils/supabase/client';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: { id: string | number; name?: string; price?: number; image?: string }, quantity?: number) => boolean;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  clearLocalCart: () => void;
  getTotal: () => number;
  loadCartFromSupabase: () => Promise<void>;
  syncCartToSupabase: (items: CartItem[]) => Promise<void>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        const currentItems = get().items;
        const id = String(item.id);
        const existingItem = currentItems.find((i) => i.id === id);

        if (existingItem) {
          return false; // المنتج موجود مسبقاً
        }

        const updatedItems: CartItem[] = [
          ...currentItems,
          {
            id,
            name: item.name || 'منتج خيرى',
            price: Number(item.price) || 0,
            image: item.image || '',
            quantity: Math.max(1, quantity),
          },
        ];
        
        set({ items: updatedItems });
        get().syncCartToSupabase(updatedItems);
        return true;
      },

      removeItem: (id) => {
        const updatedItems = get().items.filter((i) => i.id !== id);
        set({ items: updatedItems });
        get().syncCartToSupabase(updatedItems);
      },

      updateQuantity: (id, quantity) => {
        const updatedItems = get().items.map((i) =>
          i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
        );
        set({ items: updatedItems });
        get().syncCartToSupabase(updatedItems);
      },

      clearCart: () => {
        set({ items: [] });
        get().syncCartToSupabase([]);
      },

      clearLocalCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        return get().items.reduce((total, item) => total + (item.price || 0) * (item.quantity || 1), 0);
      },

      loadCartFromSupabase: async () => {
        try {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return;

          const { data, error } = await supabase
            .from('user_carts')
            .select('items')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (error) {
            console.error('Load Cart Error:', error.message);
            return;
          }

          if (data && Array.isArray(data.items)) {
            set({ items: data.items });
          }
        } catch (err) {
          console.error('Load Cart Error:', err);
        }
      },

      syncCartToSupabase: async (itemsToSync) => {
        try {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return;

          await supabase.from('user_carts').upsert({
            user_id: session.user.id,
            items: itemsToSync,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        } catch (err) {
          console.error('Sync Cart Error:', err);
        }
      },
    }),
    {
      name: 'sanad-cart-storage',
    }
  )
);