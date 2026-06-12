/**
 * Chamakdar (চমকদার) - Landing Page Interactive Script
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Page from Config
  initializeFromConfig();

  // Initialize Price calculations
  updateOrderPrices();

  // Setup Event Listeners
  setupEventListeners();

  // Facebook Pixel — ViewContent tracking on product cards
  fbSetupViewContentTracking();
});

/**
 * Initializes layout values (phone numbers, links, prices) using config.js
 */
function initializeFromConfig() {
  if (typeof CHAMAKDAR_CONFIG === "undefined") {
    console.error("Configuration file 'config.js' not found or loaded.");
    return;
  }

  const config = CHAMAKDAR_CONFIG;

  // Update WhatsApp Link
  const floatingWhatsapp = document.getElementById("floating-whatsapp");
  if (floatingWhatsapp) {
    floatingWhatsapp.setAttribute("href", `https://wa.me/${config.whatsappNumber.replace('+', '')}`);
  }

  // Update Footer WhatsApp Link
  const footerWhatsapp = document.getElementById("footer-wa-link");
  if (footerWhatsapp) {
    footerWhatsapp.setAttribute("href", `https://wa.me/${config.whatsappNumber.replace('+', '')}`);
  }

  // Update Facebook Link
  const fbLink = document.getElementById("footer-fb-link");
  if (fbLink) {
    fbLink.setAttribute("href", config.facebookPageUrl);
  }

  // Update prices shown on cards dynamically from config
  const comboPriceText = document.querySelectorAll("#card-combo .price-new");
  comboPriceText.forEach(el => {
    el.textContent = `৳${config.products.combo.price}`;
  });

  const sewingPriceText = document.querySelectorAll("#card-sewing .price-new");
  sewingPriceText.forEach(el => {
    el.textContent = `৳${config.products.sewing.price}`;
  });

  const grinderPriceText = document.querySelectorAll("#card-grinder .price-new");
  grinderPriceText.forEach(el => {
    el.textContent = `৳${config.products.grinder.price}`;
  });

  const formComboPriceLabel = document.querySelector("#label-combo .product-option-price");
  if (formComboPriceLabel) {
    formComboPriceLabel.textContent = `৳${config.products.combo.price}`;
  }

  const formSewingPriceLabel = document.querySelector("#label-sewing .product-option-price");
  if (formSewingPriceLabel) {
    formSewingPriceLabel.textContent = `৳${config.products.sewing.price}`;
  }

  const formGrinderPriceLabel = document.querySelector("#label-grinder .product-option-price");
  if (formGrinderPriceLabel) {
    formGrinderPriceLabel.textContent = `৳${config.products.grinder.price}`;
  }
}

/**
 * Sets up listeners for user actions
 */
function setupEventListeners() {
  // Sticky header transition on scroll
  const header = document.getElementById("main-header");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // Product selector inputs
  const productRadios = document.querySelectorAll('input[name="selected_product"]');
  productRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      // Toggle CSS selection classes on wrappers
      document.querySelectorAll(".product-option-label").forEach(label => {
        label.classList.remove("selected");
      });
      const selectedLabel = document.getElementById(`label-${e.target.value}`);
      if (selectedLabel) {
        selectedLabel.classList.add("selected");
      }
      updateOrderPrices();
    });
  });

  // Quantity Stepper buttons logic
  const qtyInput = document.getElementById("order-quantity");
  const minusBtn = document.getElementById("btn-qty-minus");
  const plusBtn = document.getElementById("btn-qty-plus");

  if (minusBtn && plusBtn && qtyInput) {
    minusBtn.addEventListener("click", () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val > 1) {
        qtyInput.value = val - 1;
        updateOrderPrices();
      }
    });

    plusBtn.addEventListener("click", () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val < 10) {
        qtyInput.value = val + 1;
        updateOrderPrices();
      }
    });
  }

  // Delivery Location Pills logic
  const deliveryRadios = document.querySelectorAll('input[name="delivery_location"]');
  deliveryRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      // Toggle CSS selection classes on delivery pills labels
      document.querySelectorAll(".delivery-pill-label").forEach(label => {
        label.classList.remove("selected");
      });
      const selectedLabel = document.getElementById(`label-del-${e.target.value}`);
      if (selectedLabel) {
        selectedLabel.classList.add("selected");
      }
      updateOrderPrices();
    });
  });

  // Form submission
  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", handleOrderSubmit);

    // Facebook Pixel — Track InitiateCheckout on first form interaction
    let checkoutTracked = false;
    checkoutForm.addEventListener("focusin", () => {
      if (!checkoutTracked) {
        checkoutTracked = true;
        fbTrackInitiateCheckout();
      }
    });
  }

  // FAQ Accordion
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const question = item.querySelector(".faq-question");
    question.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      // Close other active FAQs
      faqItems.forEach(otherItem => {
        otherItem.classList.remove("active");
        otherItem.querySelector(".faq-answer").style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add("active");
        const answer = item.querySelector(".faq-answer");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
}

/**
 * Selects product in the checkout form and scrolls to it
 * Used by the buttons on the product catalog cards
 */
function selectProductAndScroll(productId) {
  const radio = document.getElementById(`prod-${productId}`);
  if (radio) {
    radio.checked = true;

    // Fire the change event manually to update labels and pricing calculation
    const event = new Event("change");
    radio.dispatchEvent(event);
  }

  // Facebook Pixel — Track AddToCart
  fbTrackAddToCart(productId);

  // Scroll to checkout form section smoothly
  const orderSection = document.getElementById("order-form-section");
  if (orderSection) {
    orderSection.scrollIntoView({ behavior: "smooth" });
  }
}

/**
 * Recalculates product subtotals, delivery charges, and total sum payable
 */
function updateOrderPrices() {
  if (typeof CHAMAKDAR_CONFIG === "undefined") return;

  const config = CHAMAKDAR_CONFIG;

  // Get selected product price
  const selectedProductRadio = document.querySelector('input[name="selected_product"]:checked');
  if (!selectedProductRadio) return;
  const selectedProductKey = selectedProductRadio.value;
  const productPrice = config.products[selectedProductKey].price;

  // Get quantity
  const qtyInput = document.getElementById("order-quantity");
  const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;

  // Get delivery charges from checked radio pill
  const deliveryRadio = document.querySelector('input[name="delivery_location"]:checked');
  const deliveryLoc = deliveryRadio ? deliveryRadio.value : "outside";
  const deliveryCharge = deliveryLoc === "inside"
    ? config.deliveryCharges.insideDhaka
    : config.deliveryCharges.outsideDhaka;

  // Compute values
  const productSubtotal = productPrice * qty;
  const totalPrice = productSubtotal + deliveryCharge;

  // Render to DOM
  const summaryProd = document.getElementById("summary-product-price");
  const summaryDel = document.getElementById("summary-delivery-charge");
  const summaryTotal = document.getElementById("summary-total-price");
  const submitBtnText = document.getElementById("submit-btn-text");

  if (summaryProd) summaryProd.textContent = `৳${formatPrice(productSubtotal)}`;
  if (summaryDel) summaryDel.textContent = `৳${formatPrice(deliveryCharge)}`;
  if (summaryTotal) summaryTotal.textContent = `৳${formatPrice(totalPrice)}`;

  // High-converting button text update
  if (submitBtnText) {
    submitBtnText.textContent = `৳${formatPrice(totalPrice)} - অর্ডার নিশ্চিত করুন (ক্যাশ অন ডেলিভারি)`;
  }

  // Update stepper button disabled states
  const currentQty = parseInt(document.getElementById("order-quantity")?.value) || 1;
  const minusBtn = document.getElementById("btn-qty-minus");
  const plusBtn = document.getElementById("btn-qty-plus");
  if (minusBtn) minusBtn.disabled = currentQty <= 1;
  if (plusBtn) plusBtn.disabled = currentQty >= 10;
}

/**
 * Form validation and order submission flow
 */
function handleOrderSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById("cust-name");
  const phoneInput = document.getElementById("cust-phone");
  const addressInput = document.getElementById("cust-address");
  const qtyInput = document.getElementById("order-quantity");

  const productRadio = document.querySelector('input[name="selected_product"]:checked');
  const deliveryRadio = document.querySelector('input[name="delivery_location"]:checked');

  // Basic Trim Check
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const address = addressInput.value.trim();
  const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;

  const deliveryLoc = deliveryRadio ? deliveryRadio.value : "outside";
  const delivery = deliveryLoc === "inside" ? "ঢাকা সিটি (ভিতরে)" : "ঢাকার বাইরে (অন্যান্য জেলা)";

  const productKey = productRadio ? productRadio.value : "sewing";
  const productName = CHAMAKDAR_CONFIG.products[productKey].name;

  const productPrice = CHAMAKDAR_CONFIG.products[productKey].price;
  const deliveryCharge = deliveryLoc === "inside"
    ? CHAMAKDAR_CONFIG.deliveryCharges.insideDhaka
    : CHAMAKDAR_CONFIG.deliveryCharges.outsideDhaka;
  const totalPrice = (productPrice * qty) + deliveryCharge;

  // Validation
  if (!name) {
    alert("অনুগ্রহ করে আপনার নাম লিখুন!");
    nameInput.focus();
    return;
  }

  if (!phone) {
    alert("অনুগ্রহ করে আপনার মোবাইল নম্বর লিখুন!");
    phoneInput.focus();
    return;
  }

  // BD Phone Number Regex validation (11 digits, starts with 01)
  const phoneRegex = /^01[3-9]\d{8}$/;
  if (!phoneRegex.test(phone)) {
    alert("দয়া করে একটি সঠিক ১১-ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)!");
    phoneInput.focus();
    return;
  }

  if (!address) {
    alert("অনুগ্রহ করে ডেলিভারির সম্পূর্ণ ঠিকানা লিখুন!");
    addressInput.focus();
    return;
  }

  // Prepare submission button state
  const submitBtn = document.getElementById("btn-submit-order");
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.textContent = "অর্ডার সাবমিট হচ্ছে...";

  // Google Form submission logic
  const config = CHAMAKDAR_CONFIG;
  if (config.googleForm && config.googleForm.enabled) {


    // Send POST asynchronously to Google Forms using 'no-cors' mode
    // Submit via hidden iframe (only reliable method for Google Forms)
    const iframe = document.createElement("iframe");
    iframe.name = "gform_iframe";
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const hiddenForm = document.createElement("form");
    hiddenForm.method = "POST";
    hiddenForm.action = config.googleForm.actionUrl;
    hiddenForm.target = "gform_iframe";

    const fields = {
      [config.googleForm.entryIds.name]: name,
      [config.googleForm.entryIds.phone]: phone,
      [config.googleForm.entryIds.address]: address,
      [config.googleForm.entryIds.product]: productName,
      [config.googleForm.entryIds.quantity]: String(qty),
      [config.googleForm.entryIds.delivery]: delivery,
      [config.googleForm.entryIds.totalPrice]: String(totalPrice)
    };

    Object.entries(fields).forEach(([entryId, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = entryId;
      input.value = value;
      hiddenForm.appendChild(input);
    });

    document.body.appendChild(hiddenForm);

    iframe.onload = () => {
      // Iframe loaded = form submitted successfully
      fbTrackPurchase(totalPrice, productName, qty, productKey);
      showSuccessModal(name, phone, productName, qty, totalPrice);
      resetCheckoutForm();
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      updateOrderPrices();
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(hiddenForm);
        document.body.removeChild(iframe);
      }, 1000);
    };

    hiddenForm.submit();
  } else {
    // Demonstration/Testing Fallback when Google Form is not set up yet
    console.log("Mock Submission (Configure googleForm in config.js):", {
      name, phone, address, productName, qty, delivery, totalPrice
    });

    // Save to local storage for testing purposes
    const mockOrders = JSON.parse(localStorage.getItem("chamakdar_orders") || "[]");
    mockOrders.push({
      date: new Date().toISOString(),
      name, phone, address, productName, qty, delivery, totalPrice
    });
    localStorage.setItem("chamakdar_orders", JSON.stringify(mockOrders));

    // Wait a brief moment to simulate processing, then pop modal
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      fbTrackPurchase(totalPrice, productName, qty, productKey);
      showSuccessModal(name, phone, productName, qty, totalPrice);
      resetCheckoutForm();
    }, 800);
  }
}

/**
 * Formats a number with comma separators for Bengali display
 * e.g. 1119 -> "1,119"
 */
function formatPrice(amount) {
  return Number(amount).toLocaleString('en-IN');
}

/**
 * Resets checkout form fields
 */
function resetCheckoutForm() {
  document.getElementById("cust-name").value = "";
  document.getElementById("cust-phone").value = "";
  document.getElementById("cust-address").value = "";

  const qtyInput = document.getElementById("order-quantity");
  if (qtyInput) qtyInput.value = "1";

  // Reset delivery location check to default (outside)
  const delOutsideRadio = document.getElementById("del-outside");
  if (delOutsideRadio) {
    delOutsideRadio.checked = true;
    document.querySelectorAll(".delivery-pill-label").forEach(label => {
      label.classList.remove("selected");
    });
    const labelOutside = document.getElementById("label-del-outside");
    if (labelOutside) labelOutside.classList.add("selected");
  }

  updateOrderPrices();
}

/**
 * Renders and shows the confirmation modal
 * Uses CSS visibility+opacity transition (no display toggle needed)
 */
function showSuccessModal(name, phone, product, qty, total) {
  document.getElementById("modal-cust-name").textContent = name;
  document.getElementById("modal-cust-phone").textContent = phone;
  document.getElementById("modal-prod-name").textContent = product;
  document.getElementById("modal-prod-qty").textContent = `${qty} টি`;
  document.getElementById("modal-total-bill").textContent = `৳${formatPrice(total)}`;

  const modal = document.getElementById("order-success-modal");
  // Modal uses visibility+opacity CSS approach — just add active class
  modal.classList.add("active");
}

/**
 * Closes the success modal
 */
function closeSuccessModal() {
  const modal = document.getElementById("order-success-modal");
  modal.classList.remove("active");
}

/* =========================================================
   FACEBOOK PIXEL EVENT TRACKING
   ========================================================= */

/**
 * Uses Intersection Observer to fire ViewContent when product cards scroll into view
 */
function fbSetupViewContentTracking() {
  if (typeof fbq !== "function") return;

  const productCards = document.querySelectorAll(".product-card");
  if (!productCards.length) return;

  const observed = new Set();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !observed.has(entry.target)) {
        observed.add(entry.target);
        const productId = entry.target.id.replace("card-", "");
        if (CHAMAKDAR_CONFIG && CHAMAKDAR_CONFIG.products[productId]) {
          const product = CHAMAKDAR_CONFIG.products[productId];
          fbq("track", "ViewContent", {
            content_name: product.name,
            content_ids: [productId],
            content_type: "product",
            value: product.price,
            currency: "BDT"
          });
        }
      }
    });
  }, { threshold: 0.3 });

  productCards.forEach(card => observer.observe(card));
}

/**
 * Fires AddToCart when user clicks "অর্ডার করুন" on a product card
 */
function fbTrackAddToCart(productId) {
  if (typeof fbq !== "function") return;
  if (!CHAMAKDAR_CONFIG || !CHAMAKDAR_CONFIG.products[productId]) return;

  const product = CHAMAKDAR_CONFIG.products[productId];
  fbq("track", "AddToCart", {
    content_name: product.name,
    content_ids: [productId],
    content_type: "product",
    value: product.price,
    currency: "BDT"
  });
}

/**
 * Fires InitiateCheckout when user first interacts with the order form
 */
function fbTrackInitiateCheckout() {
  if (typeof fbq !== "function") return;
  fbq("track", "InitiateCheckout");
}

/**
 * Fires Purchase event after successful order submission
 */
function fbTrackPurchase(value, productName, qty, productKey) {
  if (typeof fbq !== "function") return;
  fbq("track", "Purchase", {
    content_name: productName,
    content_ids: [productKey],
    content_type: "product",
    value: value,
    currency: "BDT",
    num_items: qty
  });
}

