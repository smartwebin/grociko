/**
 * Grociko - Grocery App Theme Configuration
 * Modern, clean, and futuristic design with no shadows
 */

const theme = {
  // Brand Colors
  colors: {
    // Primary Brand Colors - Changed to Orange
    primary: {
      main: '#E17722',        // Main orange from client requirement
      light: '#F0954A',       // Lighter variant
      dark: '#C8681C',        // Darker variant
      50: '#FDF6F0',          // Very light orange background
      100: '#FBEEE1',         // Light orange tint
      200: '#F5D6C2',         // Medium light orange
      300: '#EFBEA3',         // Medium orange
      400: '#E8A684',         // Medium dark orange
      500: '#E17722',         // Main primary (client color)
      600: '#C8681C',         // Dark orange
      700: '#A85515',         // Darker orange
      800: '#87420F',         // Very dark orange
      900: '#653009',         // Deepest orange
    },

    // Secondary Colors - Changed to Slate Gray
    secondary: {
      main: '#5D6279',        // Slate gray from client requirement
      light: '#7A819C',       // Lighter gray
      dark: '#4A5066',        // Darker gray
      50: '#F4F5F7',          // Very light gray background
      100: '#E9EBF0',         // Light gray tint
      200: '#D3D7E1',         // Medium light gray
      300: '#BDC3D2',         // Medium gray
      400: '#A7AFC3',         // Medium dark gray
      500: '#5D6279',         // Main secondary (client color)
      600: '#4A5066',         // Dark gray
      700: '#3A3F52',         // Darker gray
      800: '#2A2E3E',         // Very dark gray
      900: '#1A1D2A',         // Deepest gray
    },

    // Background Colors
    background: {
      primary: '#FFFFFF',      // Main white background
      secondary: '#F8F9FA',    // Light gray background
      tertiary: '#F5F5F5',     // Card backgrounds
      gradient: {
        start: '#FDF6F0',      // Light orange
        middle: '#F4F5F7',     // Light gray
        end: '#F0F4FF',        // Light blue
        splash: '#E17722',     // Orange splash screen
      },
      overlay: 'rgba(0, 0, 0, 0.5)',  // Modal overlays
    },

    // Text Colors
    text: {
      primary: '#1A1A1A',      // Main black text
      secondary: '#666666',    // Gray subtitle text
      tertiary: '#999999',     // Light gray text
      muted: '#CCCCCC',        // Very light gray text
      white: '#FFFFFF',        // White text for dark backgrounds
      placeholder: '#B8B8B8',  // Input placeholder text
      link: '#E17722',         // Orange link color
      success: '#5CB85C',      // Success message text
      error: '#FF4444',        // Error message text
      warning: '#FF8C00',      // Warning message text
      info: '#2196F3',         // Info message text
    },

    // Surface Colors
    surface: {
      white: '#FFFFFF',        // Pure white surfaces
      light: '#FAFAFA',        // Very light gray
      medium: '#F5F5F5',       // Medium light gray
      dark: '#E0E0E0',         // Darker gray surface
      border: '#E8E8E8',       // Border colors
      divider: '#F0F0F0',      // Divider lines
      card: '#FFFFFF',         // Card backgrounds
      input: '#F8F9FA',        // Input field backgrounds
    },

    // Category Colors (updated with new primary colors)
    category: {
      fruits: {
        background: '#E8F5E8',  // Light green for fruits & vegetables
        border: '#5CB85C',
      },
      oil: {
        background: '#FDF6F0',  // Light orange for cooking oil (using new primary)
        border: '#E17722',      // Using new primary orange
      },
      meat: {
        background: '#FFE8E8',  // Light pink for meat & fish
        border: '#FF6B6B',
      },
      bakery: {
        background: '#F4F5F7',  // Light slate gray for bakery (using new secondary)
        border: '#5D6279',      // Using new secondary slate gray
      },
      dairy: {
        background: '#FFF8E1',  // Light yellow for dairy
        border: '#FFD54F',
      },
      beverages: {
        background: '#E8F4FF',  // Light blue for beverages
        border: '#42A5F5',
      },
    },

    // Status Colors
    status: {
      success: '#5CB85C',      // Green for success states
      error: '#FF4444',        // Red for error states
      warning: '#FF8C00',      // Orange for warning states
      info: '#2196F3',         // Blue for info states
      pending: '#FFB74D',      // Orange for pending states
    },

    // Rating Colors
    rating: {
      star: '#E17722',         // Orange star color (using new primary)
      empty: '#E0E0E0',        // Empty star color
    },

    // Flag Colors (Bangladesh flag)
    flag: {
      green: '#006A4E',        // Bangladesh flag green
      red: '#F42A41',          // Bangladesh flag red
    },

    // Social Media Colors
    social: {
      google: '#4285F4',       // Google blue
      facebook: '#1877F2',     // Facebook blue
    },

    // Payment Method Colors
    payment: {
      mastercard: '#EB001B',   // Mastercard red
      visa: '#1A1F71',         // Visa blue
      paypal: '#0070BA',       // PayPal blue
    },
  },

  // Typography
  typography: {
    fontFamily: {
      primary: 'System',       // iOS system font
      secondary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    
    fontSize: {
      xs: 12,                  // Extra small text
      sm: 14,                  // Small text
      base: 16,                // Base text size
      lg: 18,                  // Large text
      xl: 20,                  // Extra large text
      '2xl': 24,               // 2x large text
      '3xl': 28,               // 3x large text (main headings)
      '4xl': 32,               // 4x large text
      '5xl': 36,               // 5x large text
      '6xl': 40,               // 6x large text
    },

    fontWeight: {
      light: '300',            // Light weight
      normal: '400',           // Normal weight
      medium: '500',           // Medium weight
      semibold: '600',         // Semi-bold weight
      bold: '700',             // Bold weight
      extrabold: '800',        // Extra bold weight
    },

    lineHeight: {
      tight: 1.2,              // Tight line height
      normal: 1.4,             // Normal line height
      relaxed: 1.6,            // Relaxed line height
      loose: 1.8,              // Loose line height
    },

    letterSpacing: {
      tight: -0.5,             // Tight letter spacing
      normal: 0,               // Normal letter spacing
      wide: 0.5,               // Wide letter spacing
    },
  },

  // Spacing System
  spacing: {
    xs: 4,                     // 4px
    sm: 8,                     // 8px
    md: 12,                    // 12px
    lg: 16,                    // 16px
    xl: 20,                    // 20px
    '2xl': 24,                 // 24px
    '3xl': 32,                 // 32px
    '4xl': 40,                 // 40px
    '5xl': 48,                 // 48px
    '6xl': 64,                 // 64px
    '7xl': 80,                 // 80px
    '8xl': 96,                 // 96px
  },

  // Border Radius
  borderRadius: {
    none: 0,                   // No radius
    sm: 8,                     // Small radius
    md: 12,                    // Medium radius
    lg: 16,                    // Large radius
    xl: 20,                    // Extra large radius
    '2xl': 24,                 // 2x large radius
    '3xl': 32,                 // 3x large radius
    full: 9999,                // Full circle
  },

  // Border Width
  borderWidth: {
    0: 0,                      // No border
    1: 1,                      // 1px border
    2: 2,                      // 2px border
    4: 4,                      // 4px border
  },

  // Opacity
  opacity: {
    0: 0,                      // Fully transparent
    10: 0.1,                   // 10% opacity
    20: 0.2,                   // 20% opacity
    30: 0.3,                   // 30% opacity
    40: 0.4,                   // 40% opacity
    50: 0.5,                   // 50% opacity
    60: 0.6,                   // 60% opacity
    70: 0.7,                   // 70% opacity
    80: 0.8,                   // 80% opacity
    90: 0.9,                   // 90% opacity
    100: 1,                    // Fully opaque
  },

  // Icon Sizes
  iconSize: {
    xs: 12,                    // Extra small icons
    sm: 16,                    // Small icons
    md: 20,                    // Medium icons
    lg: 24,                    // Large icons
    xl: 28,                    // Extra large icons
    '2xl': 32,                 // 2x large icons
    '3xl': 40,                 // 3x large icons
    '4xl': 48,                 // 4x large icons
  },

  // Component Specific Styles
  components: {
    // Button Styles
    button: {
      height: {
        sm: 36,                // Small button height
        md: 48,                // Medium button height
        lg: 56,                // Large button height
      },
      padding: {
        horizontal: 24,        // Horizontal padding
        vertical: 12,          // Vertical padding
      },
      borderRadius: 16,        // Button border radius
    },

    // Input Styles
    input: {
      height: 56,              // Input field height
      padding: {
        horizontal: 16,        // Horizontal padding
        vertical: 16,          // Vertical padding
      },
      borderRadius: 12,        // Input border radius
      borderWidth: 1,          // Input border width
    },

    // Card Styles
    card: {
      padding: 16,             // Card padding
      borderRadius: 16,        // Card border radius
      gap: 12,                 // Gap between card elements
    },

    // Modal Styles
    modal: {
      borderRadius: 20,        // Modal border radius
      padding: 24,             // Modal padding
      marginHorizontal: 20,    // Modal horizontal margin
    },

    // Bottom Tab Styles
    bottomTab: {
      height: 83,              // Bottom tab height (including safe area)
      iconSize: 24,            // Tab icon size
      labelSize: 12,           // Tab label size
      padding: 12,             // Tab padding
    },

    // Search Bar Styles
    searchBar: {
      height: 48,              // Search bar height
      borderRadius: 12,        // Search bar border radius
      padding: 16,             // Search bar padding
    },

    // Product Card Styles
    productCard: {
      borderRadius: 16,        // Product card border radius
      padding: 12,             // Product card padding
      imageHeight: 120,        // Product image height
    },

    // Category Card Styles
    categoryCard: {
      borderRadius: 20,        // Category card border radius
      padding: 16,             // Category card padding
      height: 160,             // Category card height
    },

    // Avatar Styles
    avatar: {
      size: {
        sm: 40,              // Small avatar
        md: 60,              // Medium avatar
        lg: 80,              // Large avatar
        xl: 100,             // Extra large avatar
      },
      borderRadius: 999,       // Avatar border radius (circle)
    },

    // Quantity Selector Styles
    quantitySelector: {
      buttonSize: 40,          // Plus/minus button size
      borderRadius: 12,        // Quantity selector border radius
      minWidth: 100,           // Minimum width
    },

    // Price Styles
    price: {
      fontSize: 18,            // Price font size
      fontWeight: '700',       // Price font weight
      color: '#1A1A1A',        // Price color
    },

    // Header Styles
    header: {
      height: 60,              // Header height
      paddingHorizontal: 20,   // Header horizontal padding
      titleSize: 18,           // Header title size
    },
  },

  // Animation Durations
  animation: {
    duration: {
      fast: 150,               // Fast animations
      normal: 300,             // Normal animations
      slow: 500,               // Slow animations
    },
    easing: {
      ease: 'ease',            // Standard easing
      easeIn: 'ease-in',       // Ease in
      easeOut: 'ease-out',     // Ease out
      easeInOut: 'ease-in-out', // Ease in and out
    },
  },

  // Layout
  layout: {
    container: {
      maxWidth: 414,           // Max container width (iPhone dimensions)
      paddingHorizontal: 20,   // Container horizontal padding
    },
    grid: {
      columns: 2,              // Default grid columns
      gap: 16,                 // Grid gap
    },
  },

  // Breakpoints (for responsive design)
  breakpoints: {
    xs: 0,                     // Extra small devices
    sm: 375,                   // Small devices
    md: 414,                   // Medium devices
    lg: 768,                   // Large devices
    xl: 1024,                  // Extra large devices
  },

  // Z-index values
  zIndex: {
    hide: -1,                  // Hide elements
    base: 0,                   // Base level
    docked: 10,                // Docked elements
    dropdown: 1000,            // Dropdown menus
    sticky: 1100,              // Sticky elements
    banner: 1200,              // Banner notifications
    overlay: 1300,             // Overlay elements
    modal: 1400,               // Modal dialogs
    popover: 1500,             // Popover elements
    skipLink: 1600,            // Skip links
    toast: 1700,               // Toast notifications
    tooltip: 1800,             // Tooltips
  },
};

export default theme;