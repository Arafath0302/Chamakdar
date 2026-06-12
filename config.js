
const CHAMAKDAR_CONFIG = {
  // Brand details
  brandName: "চমকদার",
  tagline: "আপনার দৈনন্দিন জীবনকে সহজ ও সুন্দর করতে প্রিমিয়াম কোয়ালিটি প্রোডাক্টস!",
  whatsappNumber: "+8801947257370", // WhatsApp number with country code
  facebookPageUrl: "https://www.facebook.com/profile.php?id=61589633454945", // Replace with your Facebook page URL

  // Facebook Pixel ID — Replace with your actual Pixel ID from Events Manager
  facebookPixelId: "YOUR_PIXEL_ID_HERE",
  
  // Delivery Charges (টাকা)
  deliveryCharges: {
    insideDhaka: 80,   // ঢাকা সিটির ভিতরে ডেলিভারি চার্জ
    outsideDhaka: 140  // ঢাকা সিটির বাইরে ডেলিভারি চার্জ
  },

  // Products Details
  products: {
    combo: {
      id: "combo",
      name: "কম্বো প্যাক: ফুড গ্রাইন্ডার + মাল্টি কুকার + মসলার বাটি",
      price: 1650, // টাকা
      originalPrice: 2450,
      image: "assets/combo pack.jpeg",
      badge: "সেরা ডিল",
      isFeatured: true
    },
    sewing: {
      id: "sewing",
      name: "মিনি সেলাই মেশিন (Mini Sewing Machine)",
      price: 999, // টাকা
      image: "assets/sewing_machine.png",
      badge: "জনপ্রিয়"
    },
    grinder: {
      id: "grinder",
      name: "ফুড গ্রাইন্ডার (Food Grinder)",
      price: 1100, // টাকা
      image: "assets/food_grinder.png",
      badge: "সেরা অফার"
    }
  },

  // Google Form Integration Configuration (For Low-Cost Order Capture)
  // To setup:
  // 1. Create a Google Form with fields: Name, Phone, Address, Product, Quantity, Delivery Location, Total Price.
  // 2. Click "Get pre-filled link", enter dummy data, and click "Get link".
  // 3. Inspect the link to get the Entry IDs (like entry.123456789).
  // 4. Fill in the parameters below.
  googleForm: {
    enabled: true, // Set to true once you fill in the actionUrl and entryIds below
    
    // Example: https://docs.google.com/forms/d/e/1FAIpQLSfXXXXXXXXXXXXX/formResponse
    actionUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfMA4Z9rHfXfZMXZPvLRK0MbJi1_ncss8154D2s5k78xKpxNg/formResponse",
    
    // Map your form fields to Google Form Entry IDs
    entryIds: {
      name: "entry.645647278",      // Customer Name Field ID
      phone: "entry.1264098632",     // Customer Phone Number Field ID
      address: "entry.387208573",   // Customer Full Address Field ID
      product: "entry.830105660",   // Selected Product Field ID
      quantity: "entry.1120194264",  // Order Quantity Field ID
      delivery: "entry.471036601",  // Delivery Area (Inside/Outside Dhaka) Field ID
      totalPrice: "entry.1811605097" // Total Calculated Price Field ID
    }
  }
};

// Export configuration if using modules, or let it be global for simple script tag import
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CHAMAKDAR_CONFIG;
}
