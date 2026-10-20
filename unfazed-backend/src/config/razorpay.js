const Razorpay = require('razorpay');

let razorpayInstance = null;

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (keyId && keySecret && !keyId.includes('your_razorpay') && !keyId.includes('demo')) {
  try {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    console.log('[Payment Gateway] Razorpay initialized with credentials.');
  } catch (err) {
    console.warn('[Payment Gateway] Failed to initialize Razorpay SDK:', err.message);
  }
} else {
  console.log('[Payment Gateway] Razorpay credentials not configured or in placeholder mode. Simulated sandbox mode enabled.');
}

const getRazorpayInstance = () => {
  return razorpayInstance;
};

module.exports = {
  getRazorpayInstance,
  isConfigured: () => Boolean(razorpayInstance),
};
