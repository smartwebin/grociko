import { API_CONFIG, logApiRequest, logApiResponse } from "@/config/api";
import * as SecureStore from "expo-secure-store";

/**
 * API Service for Grociko App
 * Handles all API requests with authentication and error handling
 */

// SecureStore Keys
const STORAGE_KEYS = {
  USER_DATA: "grociko_user_data",
  JWT_TOKEN: "grociko_jwt_token",
  USER_ID: "grociko_user_id",
};

/**
 * Create Basic Auth header
 */
const getBasicAuthHeader = () => {
  const credentials = `${API_CONFIG.BASIC_AUTH.USERNAME}:${API_CONFIG.BASIC_AUTH.PASSWORD}`;
  const encodedCredentials = btoa(credentials);
  return `Basic ${encodedCredentials}`;
};

/**
 * Create request headers with Basic Auth
 */
const createHeaders = (isFormData = false) => {
  const headers = {
    Authorization: getBasicAuthHeader(),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
    headers["Accept"] = "application/json";
  }

  return headers;
};

/**
 * Handle API errors
 */
const handleApiError = (error, endpoint) => {
  console.error(`API Error at ${endpoint}:`, error);

  if (error.response) {
    // Server responded with error status
    return {
      success: false,
      error: error.response.data?.message || "Server error occurred",
      statusCode: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    // Request made but no response
    return {
      success: false,
      error: "No response from server. Please check your internet connection.",
      statusCode: 0,
    };
  } else {
    // Something else happened
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
      statusCode: 0,
    };
  }
};

/**
 * Make API request with timeout and error handling
 */
const makeRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    logApiRequest(options.method || "GET", url, options.body);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Get response text first
    const responseText = await response.text();

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(
        "Response is not valid JSON:",
        responseText.substring(0, 200),
      );
      return {
        success: false,
        error:
          "Server returned an invalid response. This might be an authentication issue.",
        statusCode: response.status,
        rawResponse: responseText.substring(0, 500),
      };
    }

    logApiResponse(url, data);

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP error! status: ${response.status}`,
        statusCode: response.status,
        data,
      };
    }

    return {
      success: true,
      data,
      statusCode: response.status,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      return {
        success: false,
        error: "Request timeout. Please try again.",
        statusCode: 408,
      };
    }
    return handleApiError(error, endpoint);
  }
};

/**
 * Save user data to SecureStore
 */
export const saveUserData = async (userData, jwt = null) => {
  try {
    await SecureStore.setItemAsync(
      STORAGE_KEYS.USER_DATA,
      JSON.stringify(userData),
    );

    // Save JWT token - either from userData or passed separately
    const token = jwt || userData.jwt;
    if (token) {
      await SecureStore.setItemAsync(STORAGE_KEYS.JWT_TOKEN, token);
    }

    if (userData.id) {
      await SecureStore.setItemAsync(
        STORAGE_KEYS.USER_ID,
        userData.id.toString(),
      );
    }

    // console.log("✅ User data saved to SecureStore");
    return { success: true };
  } catch (error) {
    console.error("❌ Error saving user data:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user data from SecureStore
 */
export const getUserData = async () => {
  try {
    const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

/**
 * Get JWT token from SecureStore
 */
export const getJwtToken = async () => {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.JWT_TOKEN);
  } catch (error) {
    console.error("Error getting JWT token:", error);
    return null;
  }
};

/**
 * Clear user data from SecureStore (logout)
 */
export const clearUserData = async () => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.JWT_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_ID);
    return { success: true };
  } catch (error) {
    console.error("Error clearing user data:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user is logged in
 */
export const isUserLoggedIn = async () => {
  const userData = await getUserData();
  const jwt = await getJwtToken();
  return !!(userData && jwt);
};

/**
 * User Signup API
 */
export const signupUser = async (formData) => {
  try {
    // For FormData, we only need Authorization header
    // Don't set Content-Type - let the browser/fetch set it with boundary
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    console.log("📤 Signup Request Headers:", headers);
    console.log(
      "📤 FormData keys:",
      Array.from(formData._parts || []).map(([key]) => key),
    );

    const response = await makeRequest("/sign-up.php", {
      method: "POST",
      headers,
      body: formData,
    });

    console.log("📥 Signup Response:", {
      success: response.success,
      statusCode: response.statusCode,
      hasData: !!response.data,
      error: response.error,
    });

    if (response.success && response.data?.response_code === 200) {
      // Save user data to SecureStore with JWT token
      const jwt = response.data.jwt;
      await saveUserData(response.data.data, jwt);

      return {
        success: true,
        data: response.data.data,
        jwt: jwt,
        message: "Account created successfully!",
      };
    } else {
      return {
        success: false,
        error:
          response.data?.data?.err?.join(", ") ||
          response.error ||
          "Signup failed",
        errors: response.data?.data?.err || [],
      };
    }
  } catch (error) {
    console.error("❌ Signup Error:", error);
    return handleApiError(error, "/sign-up.php");
  }
};

/**
 * User Login API
 * Accepts email or phone with password
 */
export const loginUser = async (loginPayload) => {
  try {
    // Create FormData for login (PHP expects POST data)
    const formData = new FormData();
    formData.append("email", loginPayload.email || "");
    formData.append("phone", loginPayload.phone || "");
    formData.append("password", loginPayload.password || "");

    console.log("🔐 Login Request:", {
      email: loginPayload.email || "(empty)",
      phone: loginPayload.phone || "(empty)",
      hasPassword: !!loginPayload.password,
    });

    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
      // Don't set Content-Type for FormData - browser will set it with boundary
    };

    const response = await makeRequest("/login.php", {
      method: "POST",
      headers,
      body: formData,
    });

    console.log("📥 Login Response:", {
      success: response.success,
      statusCode: response.statusCode,
      responseCode: response.data?.response_code,
      status: response.data?.status,
    });

    if (response.success && response.data?.response_code === 200) {
      // Save user data to SecureStore with JWT token
      const jwt = response.data.jwt;
      await saveUserData(response.data.data, jwt);

      return {
        success: true,
        data: response.data.data,
        jwt: jwt,
        message: "Login successful!",
      };
    } else if (response.data?.response_code === 220) {
      // No result found - invalid credentials
      return {
        success: false,
        error: response.data?.message || "Invalid email/phone or password",
      };
    } else {
      return {
        success: false,
        error: response.data?.message || response.error || "Login failed",
      };
    }
  } catch (error) {
    console.error("❌ Login Error:", error);
    return handleApiError(error, "/login.php");
  }
};

/**
 * Create FormData from signup form
 */
export const createSignupFormData = (formValues, imageUri) => {
  const formData = new FormData();

  // Add text fields
  formData.append("name", formValues.name || "");
  formData.append("phone", formValues.phone || "");
  formData.append("email", formValues.email || "");
  formData.append("password", formValues.password || "");
  formData.append("c_password", formValues.c_password || "");

  // Add image if provided
  if (imageUri) {
    const filename = imageUri.split("/").pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append("photo", {
      uri: imageUri,
      name: filename,
      type,
    });
  }

  return formData;
};

/**
 * Get user profile image URL
 */
export const getUserImageUrl = (imageName, size = "medium") => {
  if (!imageName) return null;

  const sizeUrls = {
    large: `${API_CONFIG.BASE_IMG_URL}/large`,
    medium: `${API_CONFIG.BASE_IMG_URL}/medium`,
    small: `${API_CONFIG.BASE_IMG_URL}/small`,
  };

  return `${sizeUrls[size] || sizeUrls.medium}/${imageName}`;
};

/**
 * Validate file before upload
 */
export const validateImageFile = (fileInfo) => {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

  const errors = [];

  if (fileInfo.fileSize && fileInfo.fileSize > MAX_SIZE) {
    errors.push("Image size must be less than 5MB");
  }

  if (fileInfo.mimeType && !ALLOWED_TYPES.includes(fileInfo.mimeType)) {
    errors.push("Only JPEG and PNG images are allowed");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get Mobile Sliders/Banners
 */
export const getMobileSliders = async (cat_id = "") => {
  try {
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    const url = cat_id
      ? `/get-mobile-slider.php?cat_id=${cat_id}`
      : "/get-mobile-slider.php";

    console.log("🎨 Fetching sliders");

    const response = await makeRequest(url, {
      method: "GET",
      headers,
    });

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data || [],
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to fetch sliders",
        data: [],
      };
    }
  } catch (error) {
    console.error("❌ Sliders Fetch Error:", error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Get Categories
 */
export const getCategories = async (status = "active") => {
  try {
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    const url = "/get-category.php";

    // console.log("📁 Fetching categories");

    const response = await makeRequest(url, {
      method: "GET",
      headers,
    });

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data || [],
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to fetch categories",
        data: [],
      };
    }
  } catch (error) {
    console.error("❌ Categories Fetch Error:", error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Get Brands
 */
export const getBrands = async (status = "active") => {
  try {
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    const url = status ? `/get-brand.php?status=${status}` : "/get-brand.php";

    console.log("🏷️ Fetching brands");

    const response = await makeRequest(url, {
      method: "GET",
      headers,
    });

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data || [],
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to fetch brands",
        data: [],
      };
    }
  } catch (error) {
    console.error("❌ Brands Fetch Error:", error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Get Products with Filters
 */
export const getProducts = async (filters = {}) => {
  try {
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters.id) queryParams.append("id", filters.id);
    if (filters.name) queryParams.append("name", filters.name);
    if (filters.cat_id) queryParams.append("cat_id", filters.cat_id);
    if (filters.sub_id) queryParams.append("sub_id", filters.sub_id);
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.featured) queryParams.append("featured", filters.featured);
    if (filters.brand_id) queryParams.append("brand_id", filters.brand_id);

    const queryString = queryParams.toString();
    const url = queryString
      ? `/get-product.php?${queryString}`
      : "/get-product.php";

    console.log("📦 Fetching products with filters:", filters);

    const response = await makeRequest(url, {
      method: "GET",
      headers,
    });

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data || [],
      };
    } else if (response.success && response.data?.response_code === 220) {
      // No results found - return success with empty array
      return {
        success: true,
        data: [],
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to fetch products",
        data: [],
      };
    }
  } catch (error) {
    console.error("❌ Products Fetch Error:", error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Get Product Details by ID
 */
export const getProductById = async (productId) => {
  try {
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    console.log("📦 Fetching product:", productId);

    const response = await makeRequest(`/get-product.php?id=${productId}`, {
      method: "GET",
      headers,
    });

    console.log("📥 Product Response:", {
      success: response.success,
      statusCode: response.statusCode,
      hasData: !!response.data,
    });

    if (response.success && response.data?.response_code === 200) {
      // Return the first product from the array
      const productData =
        response.data.data && response.data.data.length > 0
          ? response.data.data[0]
          : null;

      if (productData) {
        return {
          success: true,
          data: productData,
        };
      } else {
        return {
          success: false,
          error: "Product not found",
        };
      }
    } else if (response.data?.response_code === 220) {
      return {
        success: false,
        error: "Product not found",
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to fetch product",
      };
    }
  } catch (error) {
    console.error("❌ Product Fetch Error:", error);
    return handleApiError(error, "/get-product.php");
  }
};

/**
 * Get User Profile by ID
 */
export const getUserProfile = async (userId) => {
  try {
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    const response = await makeRequest(`/get-user.php?id=${userId}`, {
      method: "GET",
      headers,
    });

    if (response.success && response.data?.response_code === 200) {
      const rawData = response.data.data[0];

      // ✅ Extract first user object if array
      const userData = Array.isArray(rawData) ? rawData[0] : rawData;

      return {
        success: true,
        data: userData,
      };
    } else {
      return {
        success: false,
        error: response.data?.message || "Failed to fetch user profile",
      };
    }
  } catch (error) {
    console.error("❌ User Profile Fetch Error:", error);
    return handleApiError(error, "/get-user.php");
  }
};

/**
 * Update User Profile
 */
export const updateUserProfile = async (userId, userData, imageFile = null) => {
  try {
    console.log("📤 Updating user profile:", userId);

    // Create FormData with all fields
    const formData = new FormData();
    formData.append("id", userId);
    formData.append("name", userData.name);
    formData.append("username", userData.username || userData.name);
    formData.append("email", userData.email);
    formData.append("phone", userData.phone);

    // Add image if provided
    if (imageFile) {
      const filename = imageFile.uri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("photo", {
        uri: imageFile.uri,
        name: filename,
        type: type,
      });
    }

    const response = await makeRequest("/update-user.php", {
      method: "POST",
      headers: {
        Authorization: getBasicAuthHeader(),
        Accept: "application/json",
        // Don't set Content-Type - let React Native set it with boundary
      },
      body: formData,
    });

    console.log("📥 Update Profile Response:", response);

    if (!response.success || response.data?.response_code !== 200) {
      return {
        success: false,
        error:
          response.data?.message ||
          response.error ||
          "Failed to update profile",
      };
    }
    console.log("✅ Profile updated successfully", response.data);

    const updatedUser = response.data.data;

    // Update local user data
    const jwt = await getJwtToken();
    await saveUserData(updatedUser, jwt);

    return {
      success: true,
      data: updatedUser,
      message: "Profile updated successfully!",
    };
  } catch (error) {
    console.error("❌ Update Profile Error:", error);
    return handleApiError(error, "/update-user.php");
  }
};

export const setDefaultAddress = async (addressId, userId) => {
  try {
    const formData = new FormData();
    formData.append("id", addressId);
    formData.append("user_id", userId);

    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    console.log("⭐ Setting default address:", addressId);

    const response = await makeRequest("/set-default-address.php", {
      method: "POST",
      headers,
      body: formData,
    });

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data,
        message: "Default address updated successfully",
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to set default address",
      };
    }
  } catch (error) {
    console.error("❌ Set Default Address Error:", error);
    return handleApiError(error, "/set-default-address.php");
  }
};

/**
 * Get User Addresses
 */
export const getUserAddresses = async (userId) => {
  try {
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    console.log("📍 Fetching user addresses:", userId);

    const response = await makeRequest(
      `/get-user-address.php?user_id=${userId}`,
      {
        method: "GET",
        headers,
      },
    );

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data || [],
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to fetch addresses",
        data: [],
      };
    }
  } catch (error) {
    console.error("❌ Address Fetch Error:", error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Create User Address
 */
export const createUserAddress = async (addressData) => {
  try {
    const formData = new FormData();
    formData.append("user_id", addressData.user_id);
    formData.append("address1", addressData.address1 || "");
    formData.append("address2", addressData.address2 || "");
    formData.append("address3", addressData.address3 || "");
    formData.append("city", addressData.city || "");
    formData.append("pincode", addressData.pincode || "");
    formData.append("landmark", addressData.landmark || "");

    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    console.log("📝 Creating address");

    const response = await makeRequest("/create-address.php", {
      method: "POST",
      headers,
      body: formData,
    });

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data,
        message: "Address created successfully",
      };
    } else {
      return {
        success: false,
        error:
          response.data?.data?.err?.join(", ") ||
          response.error ||
          "Failed to create address",
      };
    }
  } catch (error) {
    console.error("❌ Create Address Error:", error);
    return handleApiError(error, "/create-address.php");
  }
};

/**
 * Update User Address
 */
export const updateUserAddress = async (addressData) => {
  try {
    const formData = new FormData();
    formData.append("id", addressData.id);
    formData.append("user_id", addressData.user_id);
    formData.append("address1", addressData.address1 || "");
    formData.append("address2", addressData.address2 || "");
    formData.append("address3", addressData.address3 || "");
    formData.append("city", addressData.city || "");
    formData.append("pincode", addressData.pincode || "");
    formData.append("landmark", addressData.landmark || "");

    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    console.log("✏️ Updating address:", addressData.id);

    const response = await makeRequest("/update-address.php", {
      method: "POST",
      headers,
      body: formData,
    });

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data,
        message: "Address updated successfully",
      };
    } else {
      return {
        success: false,
        error:
          response.data?.data?.err?.join(", ") ||
          response.error ||
          "Failed to update address",
      };
    }
  } catch (error) {
    console.error("❌ Update Address Error:", error);
    return handleApiError(error, "/update-address.php");
  }
};

/**
 * Delete User Address
 */
export const deleteUserAddress = async (addressId, userId) => {
  try {
    const formData = new FormData();
    formData.append("id", addressId);
    formData.append("user_id", userId);

    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    console.log("🗑️ Deleting address:", addressId);

    const response = await makeRequest("/delete-address.php", {
      method: "POST",
      headers,
      body: formData,
    });

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        message: "Address deleted successfully",
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to delete address",
      };
    }
  } catch (error) {
    console.error("❌ Delete Address Error:", error);
    return handleApiError(error, "/delete-address.php");
  }
};
/**
 * Get Search Filters (Categories, Subcategories, Brands)
 */
export const getFilters = async () => {
  try {
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    console.log("🔍 Fetching search filters");

    const response = await makeRequest("/get-filters.php", {
      method: "GET",
      headers,
    });

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data || {},
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to fetch filters",
        data: {},
      };
    }
  } catch (error) {
    console.error("❌ Filters Fetch Error:", error);
    return { success: false, error: error.message, data: {} };
  }
};

/**
 * Get Delivery Charge based on address
 */
export const getDeliveryCharge = async (addressId) => {
  try {
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    console.log("🚚 Fetching delivery charge for address:", addressId);

    const response = await makeRequest(
      `/get-delivery-charge.php?address_id=${addressId}`,
      {
        method: "GET",
        headers,
      },
    );

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to fetch delivery charge",
        data: null,
      };
    }
  } catch (error) {
    console.error("❌ Delivery Charge Fetch Error:", error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Get Offer/Promo Codes
 */
export const getOfferCodes = async (filters = {}) => {
  try {
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    const queryParams = new URLSearchParams();
    if (filters.id) queryParams.append("id", filters.id);
    if (filters.offer_code)
      queryParams.append("offer_code", filters.offer_code);
    if (filters.status) queryParams.append("status", filters.status);

    const queryString = queryParams.toString();
    const url = queryString
      ? `/get-offer-code.php?${queryString}`
      : "/get-offer-code.php?status=active";

    console.log("🎟️ Fetching offer codes");

    const response = await makeRequest(url, {
      method: "GET",
      headers,
    });

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data || [],
      };
    } else if (response.success && response.data?.response_code === 220) {
      // No codes found
      return {
        success: true,
        data: [],
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to fetch offer codes",
        data: [],
      };
    }
  } catch (error) {
    console.error("❌ Offer Codes Fetch Error:", error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Create Order (Checkout)
 */
export const createOrder = async (orderData) => {
  try {
    const formData = new FormData();
    formData.append("user_id", String(orderData.user_id));
    formData.append("address_id", String(orderData.address_id));
    formData.append("product_data", orderData.product_data); // JSON string of [{prod_id, quantity}]
    formData.append("off_code_id", String(orderData.off_code_id || ""));
    formData.append("pay_method", String(orderData.pay_method));

    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    console.log("🛒 Creating order for user:", orderData.user_id);

    const response = await makeRequest("/create-order.php", {
      method: "POST",
      headers,
      body: formData,
    });

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } else {
      return {
        success: false,
        error:
          response.data?.message || response.error || "Failed to create order",
        data: null,
      };
    }
  } catch (error) {
    console.error("❌ Create Order Error:", error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Get User Orders
 */
export const getUserOrders = async (
  userId,
  statusFilter = null,
  pagination = {},
) => {
  try {
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append("user_id", userId);

    if (statusFilter) {
      queryParams.append("status", statusFilter);
    }

    // Add pagination parameters
    if (pagination.limit) {
      queryParams.append("limit", pagination.limit);
    }
    if (pagination.page) {
      queryParams.append("page", pagination.page);
    }

    const url = `/get-orders.php?${queryParams.toString()}`;

    console.log(
      "📦 Fetching orders for user:",
      userId,
      statusFilter ? `(${statusFilter})` : "",
      pagination.page ? `Page: ${pagination.page}` : "",
    );

    const response = await makeRequest(url, {
      method: "GET",
      headers,
    });

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination, // Include pagination metadata
      };
    } else {
      return {
        success: false,
        error:
          response.data?.message || response.error || "Failed to fetch orders",
        data: [],
      };
    }
  } catch (error) {
    console.error("❌ Get Orders Error:", error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Get About Us Page
 */
export const getAboutUs = async () => {
  try {
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    console.log("ℹ️ Fetching About Us page");

    const response = await makeRequest("/get-about-us.php", {
      method: "GET",
      headers,
    });

    if (response.success && response.data?.response_code === 200) {
      // Handle nested data - API may return data under empty string key or as array
      const dataValue =
        response.data.data[""] ||
        (Array.isArray(response.data.data) ? response.data.data[0] : null) ||
        null;

      return {
        success: true,
        data: dataValue,
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to fetch About Us",
        data: null,
      };
    }
  } catch (error) {
    console.error("❌ About Us Fetch Error:", error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Get Contact Us And FAQ Data
 */
export const getContactAndFaq = async () => {
  try {
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    console.log("📞 Fetching contact details and FAQs...");

    const response = await makeRequest(`/get-contact-faq.php`, {
      method: "GET",
      headers,
    });

    // console.log("📦 API Response:", response);

    // Check if response is successful
    if (response.success && response.data?.response_code === 200) {
      const contactData = response.data.data?.contact || {};
      const faqData = response.data.data?.faq || [];

      return {
        success: true,
        contact: contactData,
        faq: faqData,
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to fetch contact and FAQ data",
        contact: {},
        faq: [],
      };
    }
  } catch (error) {
    console.error("❌ Contact & FAQ Fetch Error:", error);
    return {
      success: false,
      error: error.message,
      contact: {},
      faq: [],
    };
  }
};
/**
 * Get Contact Us And FAQ Data
 */
export const getLegalPolicy = async (currentPolicy) => {
  try {
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    console.log("📞 Fetching contact details and FAQs...");

    const response = await makeRequest("/" + currentPolicy, {
      method: "GET",
      headers,
    });

    // console.log("📦 API Response:", response);

    // Check if response is successful
    if (response.success && response.data?.response_code === 200) {
      console.log(currentPolicy, response.data.data);

      const dataValue =
        response.data.data[""] ||
        (Array.isArray(response.data.data) ? response.data.data[0] : null) ||
        null;

      return {
        success: true,
        data: dataValue,
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to fetch contact and FAQ data",
        contact: {},
        faq: [],
      };
    }
  } catch (error) {
    console.error("❌ Contact & FAQ Fetch Error:", error);
    return {
      success: false,
      error: error.message,
      contact: {},
      faq: [],
    };
  }
};

// Add these new functions to your existing apiService.js file

/**
 * Create Stripe Payment Intent
 */
export const createPaymentIntent = async (paymentData) => {
  try {
    const formData = new FormData();
    formData.append("user_id", String(paymentData.user_id));
    formData.append("amount", String(paymentData.amount));
    formData.append("currency", String(paymentData.currency || "gbp"));
    formData.append(
      "description",
      String(paymentData.description || "Grociko Order Payment"),
    );

    if (paymentData.metadata) {
      formData.append("metadata", JSON.stringify(paymentData.metadata));
    }

    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    console.log("💳 Creating payment intent for amount:", paymentData.amount);

    const response = await makeRequest("/create-payment-intent.php", {
      method: "POST",
      headers,
      body: formData,
    });

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } else {
      return {
        success: false,
        error:
          response.data?.message ||
          response.error ||
          "Failed to create payment intent",
        data: null,
      };
    }
  } catch (error) {
    console.error("❌ Create Payment Intent Error:", error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Confirm Payment and Create Order
 */
export const confirmPaymentAndCreateOrder = async (orderData) => {
  try {
    const formData = new FormData();
    formData.append("payment_intent_id", String(orderData.payment_intent_id));
    formData.append("user_id", String(orderData.user_id));
    formData.append("address_id", String(orderData.address_id));
    formData.append("product_data", orderData.product_data); // JSON string of [{prod_id, quantity}]
    formData.append("off_code_id", String(orderData.off_code_id || ""));
    formData.append("pay_method", "online_payment"); // Always online payment for this endpoint

    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    console.log(
      "💳 Confirming payment and creating order:",
      orderData.payment_intent_id,
    );

    const response = await makeRequest("/confirm-payment-order.php", {
      method: "POST",
      headers,
      body: formData,
    });

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } else {
      return {
        success: false,
        error:
          response.data?.message ||
          response.error ||
          "Failed to confirm payment and create order",
        data: null,
      };
    }
  } catch (error) {
    console.error("❌ Confirm Payment Order Error:", error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Get Transaction Details
 */
export const getTransactionDetails = async (orderId) => {
  try {
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    console.log("🔍 Fetching transaction details for order:", orderId);

    const response = await makeRequest(
      `/get-transaction.php?order_id=${orderId}`,
      {
        method: "GET",
        headers,
      },
    );

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.error || "Failed to fetch transaction details",
        data: null,
      };
    }
  } catch (error) {
    console.error("❌ Transaction Details Fetch Error:", error);
    return { success: false, error: error.message, data: null };
  }
};
// Add this function to your existing apiService.js

/**
 * Lookup addresses by UK postcode using Ideal Postcodes API
 */
export const lookupPostcode = async (postcode) => {
  try {
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    // Remove spaces and convert to uppercase
    const cleanPostcode = postcode.replace(/\s/g, "").toUpperCase();

    console.log("🔍 Looking up postcode:", cleanPostcode);

    const response = await makeRequest(
      `/postcode-lookup.php?postcode=${encodeURIComponent(cleanPostcode)}`,
      {
        method: "GET",
        headers,
      },
    );

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message,
      };
    } else if (response.success && response.data?.response_code === 404) {
      // Postcode not found
      return {
        success: false,
        error: response.data.message || "Postcode not found",
        data: [],
      };
    } else {
      return {
        success: false,
        error:
          response.data?.message ||
          response.error ||
          "Failed to lookup postcode",
        data: [],
      };
    }
  } catch (error) {
    console.error("❌ Postcode Lookup Error:", error);
    return { success: false, error: error.message, data: [] };
  }
};

// Add this function to your existing apiService.js

/**
 * Get Active Offer Codes
 * @param {Object} filters - Optional filters { id, offer_code, status }
 */
export const getOfferCodes2 = async (filters = {}) => {
  try {
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    // Build query parameters
    const queryParams = new URLSearchParams();

    if (filters.id) {
      queryParams.append("id", filters.id);
    }

    if (filters.offer_code) {
      queryParams.append("offer_code", filters.offer_code);
    }

    if (filters.status) {
      queryParams.append("status", filters.status);
    } else {
      // Default to active only
      queryParams.append("status", "active");
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `/get-offer-codes.php?${queryString}`
      : "/get-offer-codes.php?status=active";

    console.log("🎟️ Fetching offer codes:", filters);

    const response = await makeRequest(url, {
      method: "GET",
      headers,
    });

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message,
      };
    } else if (response.success && response.data?.response_code === 220) {
      // No offer codes found
      return {
        success: true,
        data: [],
        message: response.data.message,
      };
    } else {
      return {
        success: false,
        error:
          response.data?.message ||
          response.error ||
          "Failed to fetch offer codes",
        data: [],
      };
    }
  } catch (error) {
    console.error("❌ Offer Codes Fetch Error:", error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Validate Offer Code
 * Checks if code exists, is active, not expired, and meets minimum order
 */
export const validateOfferCode = async (offerCode, orderTotal) => {
  try {
    const response = await getOfferCodes2({
      offer_code: offerCode,
      status: "active",
    });

    if (!response.success || response.data.length === 0) {
      return {
        success: false,
        error: "Invalid or expired promo code",
        data: null,
      };
    }

    const offer = response.data[0];

    // Check if expired
    if (offer.is_expired) {
      return {
        success: false,
        error: "This promo code has expired",
        data: null,
      };
    }

    // Check minimum order
    if (orderTotal < offer.minimum_order) {
      return {
        success: false,
        error: `Minimum order of £${offer.minimum_order.toFixed(
          2,
        )} required for this promo code`,
        data: null,
      };
    }

    return {
      success: true,
      data: offer,
      message: "Promo code is valid",
    };
  } catch (error) {
    console.error("❌ Validate Offer Code Error:", error);
    return { success: false, error: error.message, data: null };
  }
};
export const verifyStock = async (productData) => {
  try {
    const formData = new FormData();
    const product_data = Array.isArray(productData)
      ? productData
      : JSON.stringify(productData);

    formData.append(
      "product_data",
      typeof product_data === "string"
        ? product_data
        : JSON.stringify(product_data),
    );

    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    const response = await makeRequest("/verify-stock.php", {
      method: "POST",
      headers,
      body: formData,
    });

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } else {
      return {
        success: false,
        error:
          response.data?.message || response.error || "Failed to verify stock",
        data: null,
      };
    }
  } catch (error) {
    console.error("❌ Verify Stock Error:", error);
    return { success: false, error: error.message, data: null };
  }
};
/**
 * Contact Us - Send message via contact form
 */
export const contactUs = async (contactData) => {
  try {
    const formData = new FormData();
    formData.append("fname", contactData.fname || "");
    formData.append("lname", contactData.lname || "");
    formData.append("email", contactData.email || "");
    formData.append("phone", contactData.phone || "");
    formData.append("message", contactData.message || "");

    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };

    console.log("📧 Sending contact message");

    const response = await makeRequest("/contact-us.php", {
      method: "POST",
      headers,
      body: formData,
    });

    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        message: response.data.message || "Message sent successfully",
      };
    } else if (response.data?.response_code === 409) {
      // Validation errors
      return {
        success: false,
        error: response.data.errors
          ? response.data.errors.join(", ")
          : "Please check your input",
        errors: response.data.errors || [],
      };
    } else {
      return {
        success: false,
        error:
          response.data?.message || response.error || "Failed to send message",
      };
    }
  } catch (error) {
    console.error("❌ Contact Us Error:", error);
    return { success: false, error: error.message };
  }
};

// Add this function to your apiService.js file

/**
 * Forgot Password - Request password reset email
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Response with success/error
 */
export const forgotPassword = async (email) => {
  try {
    const formData = new FormData();
    formData.append("email", email);
    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
    };
    const response = await makeRequest("/forgot-password.php", {
      method: "POST",
      headers, // FIX HERE
      body: formData,
    });

    console.log("📥 Forgot Password Response:", response.success);

    // makeRequest returns { success, data, statusCode }
    // The actual API response is in response.data
    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        message: response.data.message || "Password reset instructions sent",
        data: response.data.data,
      };
    } else if (response.data?.response_code === 404) {
      // Email not found
      return {
        success: false,
        error: response.data.message || "Email address not found",
      };
    } else if (response.data?.response_code === 409) {
      // Validation errors
      return {
        success: false,
        error: response.data.errors?.join(", ") || "Please check your input",
      };
    } else {
      return {
        success: false,
        error:
          response.data?.message ||
          response.error ||
          "Failed to send reset email",
      };
    }
  } catch (error) {
    console.error("❌ Forgot Password API Error:", error);
    return {
      success: false,
      error: "Network error. Please check your connection and try again.",
    };
  }
};

export const deleteUser = async (userId) => {
  try {
    const formData = new FormData();
    formData.append("user_id", userId);

    const headers = {
      Authorization: getBasicAuthHeader(),
      Accept: "application/json",
      "Content-Type": "multipart/form-data",
    };

    console.log("🗑 Deleting user (soft delete)");

    const response = await makeRequest("/delete-user.php", {
      method: "POST",
      headers,
      body: formData,
    });

    console.log("response data", response);
    if (response.success && response.data?.response_code === 200) {
      return {
        success: true,
        message: response.data?.message || "User deleted successfully",
      };
    } else {
      return {
        success: false,
        error:
          response.data?.data?.err?.join(", ") ||
          response.error ||
          "Failed to delete user",
      };
    }
  } catch (error) {
    console.error("❌ Delete User Error:", error);
    return handleApiError(error, "/delete-user.php");
  }
};

export { STORAGE_KEYS };
