import { clearUserData, getJwtToken, getUserData, getUserProfile, saveUserData, updateUserProfile as updateUserProfileAPI } from '@/services/apiService';
import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';

// User Context
const UserContext = createContext();

// User Actions
const USER_ACTIONS = {
  SET_USER: 'SET_USER',
  UPDATE_USER: 'UPDATE_USER',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
};

// Initial State
const initialState = {
  user: null,
  jwt: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// User Reducer
const userReducer = (state, action) => {
  switch (action.type) {
    case USER_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        jwt: action.payload.jwt,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case USER_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
        },
      };

    case USER_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };

    case USER_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case USER_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    default:
      return state;
  }
};

// UserProvider Component
export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);
  const refreshIntervalRef = useRef(null);

  // Load user data from SecureStore on app start
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  // Set up automatic profile refresh every 10 seconds when user is authenticated
  useEffect(() => {
    if (state.isAuthenticated && state.user?.id) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Set up new interval to refresh profile every 10 seconds
      refreshIntervalRef.current = setInterval(() => {
        refreshUserProfile();
      }, 10000); // 10 seconds

      // Cleanup function to clear interval when component unmounts or user logs out
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    } else {
      // If not authenticated, clear the interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }
  }, [state.isAuthenticated, state.user?.id]);

  // Load user from storage
  const loadUserFromStorage = async () => {
    try {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true });

      const [userData, jwt] = await Promise.all([
        getUserData(),
        getJwtToken(),
      ]);

      if (userData && Object.keys(userData).length > 0 && jwt) {
        dispatch({
          type: USER_ACTIONS.SET_USER,
          payload: {
            user: userData,
            jwt: jwt,
          },
        });
      } else {
        dispatch({ type: USER_ACTIONS.SET_LOADING, payload: false });
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: 'Failed to load user data' });
    }
  };

  // Refresh user profile from API
  const refreshUserProfile = async () => {
    try {
      if (!state.user?.id) {
        return;
      }

      // console.log('🔄 Refreshing user profile...');
      
      const response = await getUserProfile(state.user.id);
        // console.log('✅ User profile refreshed:', response.data);

      if (response.success && response.data) {
        // Update the user data in context
        // console.log('✅ User profile refreshed:', response.data);
        dispatch({
          type: USER_ACTIONS.UPDATE_USER,
          payload: response.data,
        });

        // Update the stored user data
        await saveUserData(response.data, state.jwt);
        
        // console.log('✅ User profile refreshed successfully');
      } else {
        // console.log('⚠️ Failed to refresh user profile:', response.error);
      }
    } catch (error) {
      console.error('❌ Error refreshing user profile:', error);
    }
  };

  // Login user
  const loginUser = async (userData, jwt) => {
    try {
      // Save to secure storage
      await saveUserData(userData, jwt);

      // Update context state
      dispatch({
        type: USER_ACTIONS.SET_USER,
        payload: {
          user: userData,
          jwt: jwt,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error logging in user:', error);
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: 'Failed to log in' });
      return { success: false, error: error.message };
    }
  };

  // Update user profile - Now calls the API
  const updateUserProfile = async (updatedData, imageFile = null) => {
    try {
      if (!state.user?.id) {
        return { success: false, error: 'User not authenticated' };
      }

      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true });

      // Call the API to update user profile
      const result = await updateUserProfileAPI(state.user.id, updatedData, imageFile);

      if (result.success) {
        // Update context state with the returned data from API
        dispatch({
          type: USER_ACTIONS.UPDATE_USER,
          payload: result.data,
        });

        dispatch({ type: USER_ACTIONS.SET_LOADING, payload: false });
        return { success: true, message: result.message };
      } else {
        dispatch({ type: USER_ACTIONS.SET_ERROR, payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: 'Failed to update profile' });
      return { success: false, error: error.message };
    }
  };

  // Logout user
  const logoutUser = async () => {
    try {
      // Clear the refresh interval first
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }

      // Clear user data from storage
      await clearUserData();
      
      // Dispatch logout action to reset state
      dispatch({ type: USER_ACTIONS.LOGOUT });
      
      console.log('✅ User logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error logging out:', error);
      // Even if there's an error, still dispatch logout to clear the state
      dispatch({ type: USER_ACTIONS.LOGOUT });
      return { success: false, error: error.message };
    }
  };

  // Utility Functions
  const getUserImage = () => {
    if (!state.user || !state.user.image_url) {
      return null;
    }
    // console.log("User Image URL:", state.user.image_url);
    // Return the full image_url if available, otherwise construct it
    return state.user.image_url ;
  };

  const getUserName = () => {
    return state.user?.name || '';
  };

  const getUserEmail = () => {
    return state.user?.email || '';
  };

  const getUserPhone = () => {
    return state.user?.phone || '';
  };

  const getUserId = () => {
    return state.user?.id || null;
  };

  // Context value
  const contextValue = {
    // State
    user: state.user,
    jwt: state.jwt,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    loginUser,
    logoutUser,
    updateUserProfile,
    refreshUser: loadUserFromStorage,
    refreshUserProfile, // Expose manual refresh function

    // Utility functions
    getUserImage,
    getUserName,
    getUserEmail,
    getUserPhone,
    getUserId,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use user context
export const useUser = () => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
};

// Export action types for testing or advanced usage
export { USER_ACTIONS };
