/**
 * Chamakdar (চমকদার) — Landing Page Script
 * Single product: Combo Pack
 */

document.addEventListener("DOMContentLoaded", () => {
  initializeFacebookPixel();
  initializeFromConfig();
  updateOrderSummary();
  setupEventListeners();
  setupComboAccordion();
  fbSetupViewContentTracking();
});

/* ─────────────────────────────────────
   FACEBOOK PIXEL
───────────────────────────────────── */

// Only fire the pixel on the real production domain.
// Blocks dev environments (localhost, 127.0.0.1) and Vercel previews.
const PRODUCTION_DOMAINS = ["chomokdar.com", "www.chomokdar.com"];

function isProductionDomain() {
  const host = window.location.hostname.toLowerCase();
  return PRODUCTION_DOMAINS.includes(host);
}

function initializeFacebookPixel() {
  if (typeof fbq !== "function") return;
  if (typeof CHAMAKDAR_CONFIG === "undefined") return;

  // BLOCK: Don't fire pixel on localhost, 127.0.0.1, Vercel previews, etc.
  if (!isProductionDomain()) {
    console.info("[FB Pixel] Blocked — not a production domain:", window.location.hostname);
    return;
  }

  // Disable Facebook's Automatic Events (stops auto-detected AddToCart, etc.)
  fbq.disablePushState = true;
  fbq('set', 'autoConfig', false, CHAMAKDAR_CONFIG.facebookPixelId);

  fbq('init', CHAMAKDAR_CONFIG.facebookPixelId);
  fbq('track', 'PageView');
}

/* ─────────────────────────────────────
   INIT FROM CONFIG
───────────────────────────────────── */
function initializeFromConfig() {
  if (typeof CHAMAKDAR_CONFIG === "undefined") {
    console.error("config.js not loaded.");
    return;
  }
  const cfg = CHAMAKDAR_CONFIG;

  const wa = document.getElementById("footer-wa-link");
  if (wa) wa.setAttribute("href", `https://wa.me/${cfg.whatsappNumber.replace('+','')}`);

  const fb = document.getElementById("footer-fb-link");
  if (fb) fb.setAttribute("href", cfg.facebookPageUrl);
}

/* ─────────────────────────────────────
   EVENT LISTENERS
───────────────────────────────────── */
function setupEventListeners() {

  // Sticky header
  const header = document.getElementById("main-header");
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 40);
  }, { passive: true });

  // ── Quantity Stepper ──
  const qtyInput = document.getElementById("order-quantity");
  const minus    = document.getElementById("btn-qty-minus");
  const plus     = document.getElementById("btn-qty-plus");

  if (minus && plus && qtyInput) {
    minus.addEventListener("click", () => {
      const v = parseInt(qtyInput.value) || 1;
      if (v > 1) { qtyInput.value = v - 1; updateOrderSummary(); }
    });
    plus.addEventListener("click", () => {
      const v = parseInt(qtyInput.value) || 1;
      if (v < 10) { qtyInput.value = v + 1; updateOrderSummary(); }
    });
  }

  // ── Delivery Pills ──
  document.querySelectorAll('input[name="delivery_location"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      document.querySelectorAll(".dpill").forEach(l => l.classList.remove("selected"));
      const lbl = document.getElementById(`label-del-${e.target.value}`);
      if (lbl) lbl.classList.add("selected");
      updateOrderSummary();
    });
  });

  // ── Form Submit ──
  const form = document.getElementById("checkout-form");
  if (form) {
    form.addEventListener("submit", handleOrderSubmit);

    // FB: InitiateCheckout on first focus — fires only once per page load
    form.addEventListener("focusin", () => {
      fbTrackInitiateCheckout();
    }, { once: true });  // 'once: true' removes listener after first fire
  }

  // ── FAQ Accordion ──
  document.querySelectorAll(".faq-item").forEach(item => {
    const q = item.querySelector(".faq-q");
    if (!q) return;
    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("active");
      // Close all
      document.querySelectorAll(".faq-item").forEach(i => {
        i.classList.remove("active");
        const a = i.querySelector(".faq-a");
        if (a) a.style.maxHeight = null;
      });
      // Open this one
      if (!isOpen) {
        item.classList.add("active");
        const a = item.querySelector(".faq-a");
        if (a) a.style.maxHeight = a.scrollHeight + "px";
      }
    });
  });

  // ── Sticky Order Bar — hide when form is visible ──
  const stickyBar       = document.getElementById("sticky-bar");
  const formCol         = document.getElementById("order-form-anchor");

  if (stickyBar && formCol) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            stickyBar.classList.add("hidden");
          } else {
            stickyBar.classList.remove("hidden");
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(formCol);
  }

  // ── Smooth scroll to order form — prevents mobile keyboard popup ──
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href="#order-form-anchor"]');
    if (!link) return;
    e.preventDefault();
    const target = document.getElementById("order-form-anchor");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      // Dismiss mobile keyboard if it accidentally opens
      setTimeout(() => {
        if (document.activeElement && document.activeElement !== document.body) {
          document.activeElement.blur();
        }
      }, 100);
    }
    if (link.id === "btn-order-now-top") {
      fbTrackInitiateCheckout();
    }
  });
}

/* ─────────────────────────────────────
   COMBO ITEM ACCORDION
───────────────────────────────────── */
function setupComboAccordion() {
  document.querySelectorAll(".ci-header").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".combo-item");
      const isOpen = item.classList.contains("open");

      // Close all other open items (accordion behaviour — only one open at a time)
      document.querySelectorAll(".combo-item.open").forEach(other => {
        if (other !== item) {
          other.classList.remove("open");
          other.querySelector(".ci-header").setAttribute("aria-expanded", "false");
        }
      });

      // Toggle this item
      item.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
    });
  });
}

/* ─────────────────────────────────────
   UPDATE ORDER SUMMARY
───────────────────────────────────── */
function updateOrderSummary() {
  if (typeof CHAMAKDAR_CONFIG === "undefined") return;

  const cfg          = CHAMAKDAR_CONFIG;
  const productPrice = cfg.products.combo.price;
  const qty          = parseInt(document.getElementById("order-quantity")?.value || 1) || 1;
  const delCharge = cfg.deliveryCharges.flat;

  const subtotal = productPrice * qty;
  const total    = subtotal + delCharge;

  const $ = id => document.getElementById(id);

  if ($("summary-product-price"))  $("summary-product-price").textContent  = `৳${fmt(subtotal)}`;
  if ($("summary-delivery-charge")) {
    $("summary-delivery-charge").textContent = delCharge === 0 ? "ফ্রী" : `৳${fmt(delCharge)}`;
  }
  if ($("summary-total-price"))     $("summary-total-price").textContent     = `৳${fmt(total)}`;

  const btnText = $("submit-btn-text");
  if (btnText) {
    btnText.textContent = `৳${fmt(total)} — অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)`;
  }

  const m = $("btn-qty-minus");
  const p = $("btn-qty-plus");
  if (m) m.disabled = qty <= 1;
  if (p) p.disabled = qty >= 10;
}

/* ─────────────────────────────────────
   FORM SUBMIT HANDLER
───────────────────────────────────── */
// Guard flag — prevents double-submit if user clicks rapidly
let _orderSubmitting = false;

function handleOrderSubmit(e) {
  e.preventDefault();

  // Block duplicate submissions
  if (_orderSubmitting) return;
  _orderSubmitting = true;

  const nameEl    = document.getElementById("cust-name");
  const phoneEl   = document.getElementById("cust-phone");
  const addrEl    = document.getElementById("cust-address");
  const qtyEl     = document.getElementById("order-quantity");
  const name    = nameEl.value.trim();
  const phone   = phoneEl.value.trim();
  const address = addrEl.value.trim();
  const qty     = parseInt(qtyEl?.value || 1) || 1;
  const delivery = "সারা বাংলাদেশ";

  const cfg          = CHAMAKDAR_CONFIG;
  const productName  = cfg.products.combo.name;
  const productPrice = cfg.products.combo.price;
  const delCharge    = cfg.deliveryCharges.flat;
  const totalPrice = (productPrice * qty) + delCharge;

  // Validation — reset guard on failure so user can try again
  if (!name) {
    _orderSubmitting = false;
    fieldError(nameEl, "অনুগ্রহ করে আপনার নাম লিখুন!");
    nameEl.focus(); return;
  }
  if (!phone) {
    _orderSubmitting = false;
    fieldError(phoneEl, "অনুগ্রহ করে মোবাইল নম্বর লিখুন!");
    phoneEl.focus(); return;
  }
  if (!/^01[3-9]\d{8}$/.test(phone)) {
    _orderSubmitting = false;
    fieldError(phoneEl, "সঠিক ১১ ডিজিটের নম্বর দিন (যেমন: 01712345678)");
    phoneEl.focus(); return;
  }
  if (!address) {
    _orderSubmitting = false;
    fieldError(addrEl, "ডেলিভারির সম্পূর্ণ ঠিকানা লিখুন!");
    addrEl.focus(); return;
  }

  // Disable button
  const submitBtn  = document.getElementById("btn-submit-order");
  const origHTML   = submitBtn.innerHTML;
  submitBtn.disabled  = true;
  submitBtn.textContent = "অর্ডার সাবমিট হচ্ছে...";

  // Google Form submission
  if (cfg.googleForm && cfg.googleForm.enabled) {
    const iframe = document.createElement("iframe");
    iframe.name = "gf_frame";
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const hf = document.createElement("form");
    hf.method = "POST";
    hf.action = cfg.googleForm.actionUrl;
    hf.target = "gf_frame";

    const fields = {
      [cfg.googleForm.entryIds.name]:       name,
      [cfg.googleForm.entryIds.phone]:      phone,
      [cfg.googleForm.entryIds.address]:    address,
      [cfg.googleForm.entryIds.product]:    productName,
      [cfg.googleForm.entryIds.quantity]:   String(qty),
      [cfg.googleForm.entryIds.delivery]:   delivery,
      [cfg.googleForm.entryIds.totalPrice]: String(totalPrice)
    };

    Object.entries(fields).forEach(([id, val]) => {
      const inp = document.createElement("input");
      inp.type = "hidden"; inp.name = id; inp.value = val;
      hf.appendChild(inp);
    });

    document.body.appendChild(hf);

    // Fire Purchase AFTER Google Form responds (iframe onload = server received data)
    let purchaseFired = false;
    const fireSuccess = () => {
      if (purchaseFired) return;
      purchaseFired = true;
      fbTrackPurchase(totalPrice, productName, qty, "combo");
      showSuccessModal(name, phone, productName, qty, totalPrice);
      resetForm();
      submitBtn.disabled = false;
      submitBtn.innerHTML = origHTML;
      updateOrderSummary();
      _orderSubmitting = false;
      setTimeout(() => {
        if (document.body.contains(hf))     document.body.removeChild(hf);
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 1200);
    };

    // onload fires when Google Form iframe gets a response
    iframe.addEventListener("load", fireSuccess, { once: true });

    // Fallback: if onload never fires within 10s (network issue), show modal anyway
    setTimeout(fireSuccess, 10000);

    hf.submit();

  } else {
    // Dev fallback
    console.log("Mock order:", { name, phone, address, productName, qty, delivery, totalPrice });
    const orders = JSON.parse(localStorage.getItem("chamakdar_orders") || "[]");
    orders.push({ date: new Date().toISOString(), name, phone, address, productName, qty, delivery, totalPrice });
    localStorage.setItem("chamakdar_orders", JSON.stringify(orders));

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origHTML;
      fbTrackPurchase(totalPrice, productName, qty, "combo");
      showSuccessModal(name, phone, productName, qty, totalPrice);
      resetForm();
      _orderSubmitting = false;  // Re-enable after dev fallback
    }, 800);
  }
}

/* ─────────────────────────────────────
   INLINE FIELD ERROR
───────────────────────────────────── */
function fieldError(el, msg) {
  // Clear previous
  el.parentNode.querySelectorAll(".field-err").forEach(e => e.remove());
  el.style.borderColor = "var(--error)";
  el.style.boxShadow   = "0 0 0 3px rgba(220,38,38,0.12)";

  const div = document.createElement("div");
  div.className = "field-err";
  div.style.cssText = "color:#dc2626;font-size:0.78rem;font-weight:600;margin-top:4px;";
  div.textContent = msg;
  el.parentNode.appendChild(div);

  el.addEventListener("input", () => {
    el.style.borderColor = "";
    el.style.boxShadow   = "";
    div.remove();
  }, { once: true });
}

/* ─────────────────────────────────────
   RESET FORM
───────────────────────────────────── */
function resetForm() {
  const $ = id => document.getElementById(id);
  $("cust-name").value    = "";
  $("cust-phone").value   = "";
  $("cust-address").value = "";
  const qty = $("order-quantity");
  if (qty) qty.value = "1";

  const delFlat = $("del-flat");
  if (delFlat) {
    delFlat.checked = true;
    document.querySelectorAll(".dpill").forEach(l => l.classList.remove("selected"));
    const lbl = $("label-del-flat");
    if (lbl) lbl.classList.add("selected");
  }
  updateOrderSummary();
}

/* ─────────────────────────────────────
   SUCCESS MODAL
───────────────────────────────────── */
function showSuccessModal(name, phone, product, qty, total) {
  const $ = id => document.getElementById(id);
  $("modal-cust-name").textContent  = name;
  $("modal-cust-phone").textContent = phone;
  $("modal-prod-name").textContent  = product;
  $("modal-prod-qty").textContent   = `${qty} টি`;
  $("modal-total-bill").textContent = `৳${fmt(total)}`;
  $("order-success-modal").classList.add("active");

  // Prevent body scroll while modal open
  document.body.style.overflow = "hidden";
}

function closeSuccessModal() {
  document.getElementById("order-success-modal").classList.remove("active");
  document.body.style.overflow = "";
}

/* ─────────────────────────────────────
   FORMAT PRICE
───────────────────────────────────── */
function fmt(amount) {
  return Number(amount).toLocaleString('en-IN');
}

/* ─────────────────────────────────────
   FACEBOOK PIXEL EVENTS
───────────────────────────────────── */
function fbSetupViewContentTracking() {
  if (typeof fbq !== "function") return;
  const imgWrap = document.querySelector(".product-img-wrap");
  if (!imgWrap || !CHAMAKDAR_CONFIG) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const p = CHAMAKDAR_CONFIG.products.combo;
        fbq("track", "ViewContent", {
          content_name: p.name,
          content_ids: ["combo"],
          content_type: "product",
          value: p.price,
          currency: "BDT"
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.4 });
  observer.observe(imgWrap);
}

function fbTrackInitiateCheckout() {
  if (typeof fbq !== "function") return;
  fbq("track", "InitiateCheckout");
}

function fbTrackPurchase(value, productName, qty, productKey) {
  if (typeof fbq !== "function") return;

  // Deduplication: generate a unique event ID per order so Facebook
  // collapses duplicates (browser pixel + server-side) into one conversion.
  const eventId = `purchase_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  fbq("track", "Purchase", {
    content_name: productName,
    content_ids: [productKey],
    content_type: "product",
    value: value,
    currency: "BDT",
    num_items: qty
  }, { eventID: eventId });
}
