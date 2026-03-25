import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useReducer } from 'react';

// Cart Context
const CartContext = createContext();

// Cart Actions
const CART_ACTIONS = {
  LOAD_CART: 'LOAD_CART',
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  TOGGLE_FAVORITE: 'TOGGLE_FAVORITE',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
};

// Initial State
const initialState = {
  items: [],
  favorites: [],
  totalItems: 0,
  totalPrice: 0,
  isLoading: false,
  error: null,
};

// Cart Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.LOAD_CART:
      return {
        ...state,
        items: action.payload.items || [],
        favorites: action.payload.favorites || [],
        totalItems: calculateTotalItems(action.payload.items || []),
        totalPrice: calculateTotalPrice(action.payload.items || []),
        isLoading: false,
      };

    case CART_ACTIONS.ADD_ITEM:
      const existingItemIndex = state.items.findIndex(
        item => item.id === action.payload.id
      );

      let updatedItems;
      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        updatedItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
            : item
        );
      } else {
        // New item, add to cart
        updatedItems = [
          ...state.items,
          {
            ...action.payload,
            quantity: action.payload.quantity || 1,
            addedAt: new Date().toISOString(),
          },
        ];
      }

      return {
        ...state,
        items: updatedItems,
        totalItems: calculateTotalItems(updatedItems),
        totalPrice: calculateTotalPrice(updatedItems),
      };

    case CART_ACTIONS.REMOVE_ITEM:
      const filteredItems = state.items.filter(
        item => item.id !== action.payload.id
      );

      return {
        ...state,
        items: filteredItems,
        totalItems: calculateTotalItems(filteredItems),
        totalPrice: calculateTotalPrice(filteredItems),
      };

    case CART_ACTIONS.UPDATE_QUANTITY:
      const quantityUpdatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0); // Remove items with 0 quantity

      return {
        ...state,
        items: quantityUpdatedItems,
        totalItems: calculateTotalItems(quantityUpdatedItems),
        totalPrice: calculateTotalPrice(quantityUpdatedItems),
      };

    case CART_ACTIONS.CLEAR_CART:
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalPrice: 0,
      };

    case CART_ACTIONS.TOGGLE_FAVORITE:
      const isFavorite = state.favorites.some(fav => fav.id === action.payload.id);
      const updatedFavorites = isFavorite
        ? state.favorites.filter(fav => fav.id !== action.payload.id)
        : [...state.favorites, { ...action.payload, addedAt: new Date().toISOString() }];

      return {
        ...state,
        favorites: updatedFavorites,
      };

    case CART_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case CART_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    default:
      return state;
  }
};

// Helper Functions
const calculateTotalItems = (items) => {
  return items.reduce((total, item) => total + item.quantity, 0);
};

const calculateTotalPrice = (items) => {
  return items.reduce((total, item) => {
    const price = item.sellingPrice || item.price || 0;
    const numericPrice = typeof price === 'string'
      ? parseFloat(price.replace(/[£$,]/g, '')) || 0
      : price || 0;
    return total + (numericPrice * item.quantity);
  }, 0);
};

// Storage Keys
const STORAGE_KEYS = {
  CART_ITEMS: '@grociko_cart_items',
  FAVORITES: '@grociko_favorites',
};

// CartProvider Component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart data from AsyncStorage on app start
  useEffect(() => {
    loadCartFromStorage();
  }, []);

  // Save cart data to AsyncStorage whenever it changes
  useEffect(() => {
    if (state.items.length > 0 || state.favorites.length > 0) {
      saveCartToStorage();
    }
  }, [state.items, state.favorites]);

  // Load cart from storage
  const loadCartFromStorage = async () => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      const [cartItems, favorites] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CART_ITEMS),
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
      ]);

      const parsedItems = cartItems ? JSON.parse(cartItems) : [];
      const parsedFavorites = favorites ? JSON.parse(favorites) : [];

      dispatch({
        type: CART_ACTIONS.LOAD_CART,
        payload: {
          items: parsedItems,
          favorites: parsedFavorites,
        },
      });
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: 'Failed to load cart data' });
    }
  };

  // Save cart to storage
  const saveCartToStorage = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(state.items)),
        AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(state.favorites)),
      ]);
    } catch (error) {
      console.error('Error saving cart to storage:', error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: 'Failed to save cart data' });
    }
  };

  // Cart Actions
  const addToCart = (item, quantity = 1) => {
    dispatch({
      type: CART_ACTIONS.ADD_ITEM,
      payload: { ...item, quantity },
    });
  };

  const removeFromCart = (itemId) => {
    dispatch({
      type: CART_ACTIONS.REMOVE_ITEM,
      payload: { id: itemId },
    });
  };

  const updateQuantity = (itemId, quantity) => {
    dispatch({
      type: CART_ACTIONS.UPDATE_QUANTITY,
      payload: { id: itemId, quantity },
    });
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  const toggleFavorite = (item) => {
    dispatch({
      type: CART_ACTIONS.TOGGLE_FAVORITE,
      payload: item,
    });
  };

  // Utility Functions
  const getItemQuantity = (itemId) => {
    const item = state.items.find(item => item.id === itemId);
    return item ? item.quantity : 0;
  };

  const isItemInCart = (itemId) => {
    return state.items.some(item => item.id === itemId);
  };

  const isItemFavorite = (itemId) => {
    return state.favorites.some(fav => fav.id === itemId);
  };

  const getCartSummary = () => {
    return {
      totalItems: state.totalItems,
      totalPrice: state.totalPrice,
      formattedPrice: `$${state.totalPrice.toFixed(2)}`,
      itemCount: state.items.length,
      favoriteCount: state.favorites.length,
    };
  };

  const getItemsByCategory = (category) => {
    return state.items.filter(item => 
      item.category && item.category.toLowerCase() === category.toLowerCase()
    );
  };

  const addAllFavoritesToCart = () => {
    state.favorites.forEach(item => {
      if (!isItemInCart(item.id)) {
        addToCart(item, 1);
      }
    });
  };

  // Context value
  const contextValue = {
    // State
    items: state.items,
    favorites: state.favorites,
    totalItems: state.totalItems,
    totalPrice: state.totalPrice,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleFavorite,
    addAllFavoritesToCart,

    // Utility functions
    getItemQuantity,
    isItemInCart,
    isItemFavorite,
    getCartSummary,
    getItemsByCategory,

    // Refresh function
    refreshCart: loadCartFromStorage,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
};

// Export action types for testing or advanced usage
export { CART_ACTIONS };
