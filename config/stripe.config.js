/**
 * Stripe Configuration for Grociko App
 * Handles Stripe payment integration
 */

export const STRIPE_CONFIG = {
  // Stripe Keys
  PUBLISHABLE_KEY: "pk_test_51SPdlQHtVSVyviR9ZKAY3mcmn10XMHvAfrfQxYopMG6ckujqms340Lc3KE902kKaJs7efFPFNGDt6z73XV0CqiOf006jLCNDDv",
  
  // Note: Secret key should NEVER be exposed in frontend code
  // It will be used in backend PHP files only
  
  // Stripe Account ID
  ACCOUNT_ID: "acct_1SPdl3HDADMKFlPP",
  
  // Payment Configuration
  CURRENCY: "gbp", // British Pound
  
  // Merchant Display Name
  MERCHANT_DISPLAY_NAME: "Grociko",
  
  // Payment Method Types
  PAYMENT_METHODS: ["card"],
  
  // Card Brand Icons (optional - for UI)
  CARD_BRANDS: {
    visa: "💳",
    mastercard: "💳",
    amex: "💳",
    discover: "💳",
    unknown: "💳",
  },
};

export default STRIPE_CONFIG;