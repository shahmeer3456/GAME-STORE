import { create } from 'zustand';
import { toast } from 'react-toastify';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../services/cartService';

export const useCartStore = create((set, get) => ({
  cartItems: [],
  total: 0,
  loading: false,
  error: null,
  
  // Fetch cart
  fetchCart: async () => {
    try {
      set({ loading: true });
      const response = await getCart();
      
      // Map the database fields to match component expectations
      const formattedItems = (response.cartItems || []).map(item => ({
        id: item.cart_id,
        quantity: item.quantity,
        game: {
          id: item.game_id,
          title: item.title,
          platform: item.platform || '',
          price: parseFloat(item.price || 0),
          imageUrl: item.image_url || '/images/game-placeholder.jpg'
        }
      }));
      
      set({ 
        cartItems: formattedItems, 
        total: response.total || 0, 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch cart',
        loading: false 
      });
    }
  },
  
  // Add item to cart
  addItem: async (gameId, quantity = 1) => {
    try {
      set({ loading: true });
      await addToCart(gameId, quantity);
      toast.success('Item added to cart');
      
      // Refresh cart
      await get().fetchCart();
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to add item to cart',
        loading: false 
      });
      toast.error(error.response?.data?.message || 'Failed to add item to cart');
    }
  },
  
  // Update cart item quantity
  updateItem: async (cartId, quantity) => {
    try {
      set({ loading: true });
      await updateCartItem(cartId, quantity);
      
      // Refresh cart
      await get().fetchCart();
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to update cart',
        loading: false 
      });
      toast.error(error.response?.data?.message || 'Failed to update cart');
    }
  },
  
  // Remove item from cart
  removeItem: async (cartId) => {
    try {
      set({ loading: true });
      await removeFromCart(cartId);
      toast.success('Item removed from cart');
      
      // Refresh cart
      await get().fetchCart();
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to remove item from cart',
        loading: false 
      });
      toast.error(error.response?.data?.message || 'Failed to remove item from cart');
    }
  },
  
  // Clear cart
  clearCart: async () => {
    try {
      set({ loading: true });
      await clearCart();
      set({ cartItems: [], total: 0, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to clear cart',
        loading: false 
      });
      toast.error(error.response?.data?.message || 'Failed to clear cart');
    }
  }
})); 