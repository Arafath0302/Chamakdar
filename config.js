
const CHAMAKDAR_CONFIG = {
  // Brand details
  brandName: "চমকদার",
  tagline: "প্রিমিয়াম কিচেন কম্বো প্যাক — সারা বাংলাদেশে ক্যাশ অন ডেলিভারি!",
  whatsappNumber: "+8801947257370",
  facebookPageUrl: "https://www.facebook.com/profile.php?id=61589633454945",

  // Facebook Pixel ID
  facebookPixelId: "1018082120683568",

  // Delivery Charges (টাকা)
  deliveryCharges: {
    flat: 0  // সারা বাংলাদেশে ফিক্সড ডেলিভারি চার্জ
  },

  // Products — Combo Pack Only
  products: {
    combo: {
      id: "combo",
      name: "কম্বো প্যাক: ফুড গ্রাইন্ডার + মাল্টি কুকার + মসলার বাটি",
      price: 1950,
      originalPrice: 2450,
      image: "assets/combo-pack.webp",
      badge: "🔥 সেরা ডিল"
    },
    combo2: {
      id: "combo2",
      name: "কম্বো প্যাক ২: সিলভার ক্রেস্ট ফুড গ্রাইন্ডার + মসলার বক্স",
      price: 1199,
      originalPrice: 1799,
      image: "assets/combo-pack-2.webp",
      badge: "🔥 সেরা ডিল",
      deliveryCharge: 50
    }
  },

  // Google Form Integration
  googleForm: {
    enabled: true,
    actionUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfMA4Z9rHfXfZMXZPvLRK0MbJi1_ncss8154D2s5k78xKpxNg/formResponse",
    entryIds: {
      name: "entry.645647278",
      phone: "entry.1264098632",
      address: "entry.387208573",
      product: "entry.830105660",
      quantity: "entry.1120194264",
      delivery: "entry.471036601",
      totalPrice: "entry.1811605097"
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CHAMAKDAR_CONFIG;
}
