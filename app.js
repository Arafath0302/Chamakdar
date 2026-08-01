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
  setupProductSlider();
  setupImageLightbox();
  fbSetupViewContentTracking();
});

/* ─────────────────────────────────────
   FACEBOOK PIXEL
───────────────────────────────────── */

// Only fire the pixel on the real production domain.
// Blocks dev environments (localhost, 127.0.0.1) and Vercel previews.
function isProductionDomain() {
  const host = window.location.hostname.toLowerCase();
  // Allow chomokdar.com and any subdomains (e.g. www, m, landing)
  return host === "chomokdar.com" || host.endsWith(".chomokdar.com");
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
   PRODUCT RESOLUTION
───────────────────────────────────── */
function getActiveProductKey() {
  return document.body.getAttribute("data-product-key") || "combo";
}

function getActiveProduct() {
  if (typeof CHAMAKDAR_CONFIG === "undefined" || !CHAMAKDAR_CONFIG.products) {
    return { id: "combo", name: "", price: 0 };
  }
  const key = getActiveProductKey();
  return CHAMAKDAR_CONFIG.products[key] || CHAMAKDAR_CONFIG.products.combo;
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
  if (wa) wa.setAttribute("href", `https://wa.me/${cfg.whatsappNumber.replace('+', '')}`);

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
  const minus = document.getElementById("btn-qty-minus");
  const plus = document.getElementById("btn-qty-plus");

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

  // ── Cooker Color Selector Radio Listener ──
  document.querySelectorAll('input[name="cooker_color"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      document.querySelectorAll(".cp-option").forEach(lbl => lbl.classList.remove("active"));
      const label = e.target.closest(".cp-option");
      if (label) {
        label.classList.add("active");
        const imgSrc = label.getAttribute("data-img");
        if (imgSrc) {
          const formPreviewImg = document.getElementById("form-preview-img");
          if (formPreviewImg) {
            formPreviewImg.style.opacity = "0.5";
            setTimeout(() => {
              formPreviewImg.src = imgSrc;
              formPreviewImg.style.opacity = "1";
            }, 100);
          }
          const dynamicCookerImg = document.getElementById("ci-cooker-dynamic-img");
          if (dynamicCookerImg) {
            dynamicCookerImg.src = imgSrc;
          }
        }
      }
    });
  });

  // ── Form Submit ──
  const form = document.getElementById("checkout-form");
  if (form) {
    form.addEventListener("submit", handleOrderSubmit);

    // FB: InitiateCheckout on first focus
    form.addEventListener("focusin", triggerInitiateCheckout, { once: true });
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
  const stickyBar = document.getElementById("sticky-bar");
  const formCol = document.getElementById("order-form-anchor");

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
    const link = e.target.closest('a');
    if (!link) return;
    
    // Check if the link's target hash is the order form anchor
    const isOrderFormLink = link.hash === "#order-form-anchor" || link.getAttribute("href") === "#order-form-anchor";
    if (!isOrderFormLink) return;

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
    triggerInitiateCheckout();
  });
}

/* ─────────────────────────────────────
   PRODUCT IMAGE SLIDER & THUMBNAILS
───────────────────────────────────── */
function setupProductSlider() {
  const track = document.getElementById("slider-track");
  const prev = document.getElementById("slider-prev");
  const next = document.getElementById("slider-next");
  const dotsEl = document.getElementById("slider-dots");
  const wrap = document.getElementById("product-slider");
  const thumbGallery = document.getElementById("thumbnail-gallery");
  if (!track || !prev || !next || !wrap) return;

  const slides = track.querySelectorAll(".slide");
  const TOTAL = slides.length;
  if (TOTAL === 0) return;
  const INTERVAL = 4000;
  let current = 0;
  let autoTimer = null;
  let startX = 0;
  let startY = 0;
  let isDragging = false;

  function goTo(idx) {
    current = (idx + TOTAL) % TOTAL;
    track.style.transform = `translateX(-${current * 100}%)`;

    // Toggle active class on slides for transition effects
    slides.forEach((s, i) => {
      s.classList.toggle("active", i === current);
    });

    if (dotsEl) {
      dotsEl.querySelectorAll(".sdot").forEach((d, i) => {
        d.classList.toggle("active", i === current);
      });
    }

    if (thumbGallery) {
      thumbGallery.querySelectorAll(".thumb-item").forEach((th, i) => {
        th.classList.toggle("active", i === current);
      });
    }
  }

  // Re-snap on resize / orientation change (no animation flash)
  function onResize() {
    track.style.transition = "none";
    track.style.transform = `translateX(-${current * 100}%)`;
    requestAnimationFrame(() => {
      track.style.transition = "";
    });
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(() => goTo(current + 1), INTERVAL);
  }

  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  // Arrow buttons
  prev.addEventListener("click", (e) => { e.stopPropagation(); goTo(current - 1); startAuto(); });
  next.addEventListener("click", (e) => { e.stopPropagation(); goTo(current + 1); startAuto(); });

  // Dot buttons
  if (dotsEl) {
    dotsEl.querySelectorAll(".sdot").forEach(dot => {
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        goTo(parseInt(dot.dataset.idx));
        startAuto();
      });
    });
  }

  // Thumbnail buttons
  if (thumbGallery) {
    thumbGallery.querySelectorAll(".thumb-item").forEach(item => {
      item.addEventListener("click", () => {
        const idx = parseInt(item.dataset.idx);
        if (!isNaN(idx)) {
          goTo(idx);
          startAuto();
        }
      });
    });
  }

  // Pause on hover
  wrap.addEventListener("mouseenter", stopAuto);
  wrap.addEventListener("mouseleave", startAuto);

  // Touch swipe — only trigger on horizontal drag
  wrap.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
    stopAuto();
  }, { passive: true });

  wrap.addEventListener("touchend", e => {
    if (!isDragging) return;
    const diffX = startX - e.changedTouches[0].clientX;
    const diffY = startY - e.changedTouches[0].clientY;
    // Only treat as horizontal swipe if horizontal movement dominates
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      goTo(diffX > 0 ? current + 1 : current - 1);
    }
    isDragging = false;
    startAuto();
  }, { passive: true });

  // Handle resize / device rotation
  window.addEventListener("resize", onResize, { passive: true });

  // Initialize first slide and track position
  goTo(0);
  startAuto();
}

/* ─────────────────────────────────────
   FULLSCREEN IMAGE LIGHTBOX MODAL
───────────────────────────────────── */
function setupImageLightbox() {
  const modal = document.getElementById("image-lightbox-modal");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const closeBtn = document.getElementById("lightbox-close-btn");
  const zoomBtn = document.getElementById("btn-zoom-image");
  if (!modal || !lightboxImg) return;

  function openLightbox(src, captionText) {
    lightboxImg.src = src;
    if (lightboxCaption) {
      lightboxCaption.textContent = captionText || "";
      lightboxCaption.style.display = captionText ? "inline-block" : "none";
    }
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (zoomBtn) {
    zoomBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const activeSlide = document.querySelector("#slider-track .slide.active");
      if (activeSlide) {
        const img = activeSlide.querySelector("img");
        const label = activeSlide.querySelector(".slide-label");
        if (img) openLightbox(img.src, label ? label.textContent : "");
      }
    });
  }

  // Also click on slide image to open lightbox
  document.querySelectorAll("#slider-track .slide").forEach(slide => {
    slide.addEventListener("click", (e) => {
      // Avoid triggering if clicked on arrows or zoom button
      if (e.target.closest(".slider-arrow") || e.target.closest(".zoom-btn")) return;
      const img = slide.querySelector("img");
      const label = slide.querySelector(".slide-label");
      if (img) openLightbox(img.src, label ? label.textContent : "");
    });
  });

  // Click on combo breakdown preview cards to zoom
  document.querySelectorAll(".ci-preview-card").forEach(card => {
    card.addEventListener("click", () => {
      const img = card.querySelector("img");
      const badge = card.querySelector(".ci-img-badge");
      if (img) openLightbox(img.src, badge ? badge.textContent : "");
    });
  });

  // Click on proof cards to zoom
  document.querySelectorAll(".proof-card").forEach(card => {
    card.addEventListener("click", () => {
      const imgSrc = card.getAttribute("data-img") || card.querySelector("img")?.src;
      const caption = card.getAttribute("data-caption") || card.querySelector("strong")?.textContent;
      if (imgSrc) openLightbox(imgSrc, caption);
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);

  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.classList.contains("lightbox-content") || e.target.classList.contains("lightbox-img-wrap")) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      closeLightbox();
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

  // Handle dropdown thumbnail switching
  document.querySelectorAll(".ci-thumb-item").forEach(thumb => {
    thumb.addEventListener("click", (e) => {
      e.stopPropagation();
      const parentContent = thumb.closest(".ci-body-content");
      if (!parentContent) return;

      parentContent.querySelectorAll(".ci-thumb-item").forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");

      const mainImg = parentContent.querySelector(".ci-full-img");
      const badge = parentContent.querySelector(".ci-img-badge");
      const src = thumb.getAttribute("data-src");
      const caption = thumb.getAttribute("data-caption");

      if (mainImg && src) mainImg.src = src;
      if (badge && caption) badge.textContent = caption;
    });
  });
}

/* ─────────────────────────────────────
   UPDATE ORDER SUMMARY
───────────────────────────────────── */
function updateOrderSummary() {
  if (typeof CHAMAKDAR_CONFIG === "undefined") return;

  const cfg = CHAMAKDAR_CONFIG;
  const product = getActiveProduct();
  const productPrice = product.price;
  const qty = parseInt(document.getElementById("order-quantity")?.value || 1) || 1;
  const delCharge = (product.deliveryCharge !== undefined) ? product.deliveryCharge : cfg.deliveryCharges.flat;

  const subtotal = productPrice * qty;
  const total = subtotal + delCharge;

  const $ = id => document.getElementById(id);

  if ($("summary-product-price")) $("summary-product-price").textContent = `৳${fmt(subtotal)}`;
  if ($("summary-delivery-charge")) {
    $("summary-delivery-charge").textContent = delCharge === 0 ? "ফ্রী" : `৳${fmt(delCharge)}`;
  }
  if ($("summary-total-price")) $("summary-total-price").textContent = `৳${fmt(total)}`;

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

  const nameEl = document.getElementById("cust-name");
  const phoneEl = document.getElementById("cust-phone");
  const addrEl = document.getElementById("cust-address");
  const qtyEl = document.getElementById("order-quantity");
  const name = nameEl.value.trim();
  const rawPhone = phoneEl.value.trim();
  const address = addrEl.value.trim();
  const qty = parseInt(qtyEl?.value || 1) || 1;

  // Convert Bangla numerals (০-৯) to English digits (0-9)
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let convertedPhone = rawPhone.replace(/[০-৯]/g, d => bnDigits.indexOf(d));

  // Normalize phone number (handles 01779220990, +8801779220990, 8801779220990, spaces, dashes)
  let cleanPhone = convertedPhone.replace(/[\s\-\(\)\+]/g, "");
  if (cleanPhone.startsWith("8801")) {
    cleanPhone = cleanPhone.slice(2);
  }
  const phone = cleanPhone;

  // Read selected product color if color picker is available
  const selectedColorEl = document.querySelector('input[name="cooker_color"]:checked');
  const selectedColor = selectedColorEl ? selectedColorEl.value : "Sky Blue";

  // Send cooker color to the Google Form delivery column entry ID!
  const delivery = selectedColor;

  const cfg = CHAMAKDAR_CONFIG;
  const product = getActiveProduct();

  // Append selected color to productName so it automatically populates in Google Sheets
  const productName = selectedColor ? `${product.name} (Color: ${selectedColor})` : product.name;
  const productPrice = product.price;
  const delCharge = (product.deliveryCharge !== undefined) ? product.deliveryCharge : cfg.deliveryCharges.flat;
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
  // Accepts 11-digit mobile numbers starting with 01 (e.g. 017..., 018..., 013..., 014..., 019...)
  if (!/^01\d{9}$/.test(phone)) {
    _orderSubmitting = false;
    fieldError(phoneEl, "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)");
    phoneEl.focus(); return;
  }
  if (!address) {
    _orderSubmitting = false;
    fieldError(addrEl, "ডেলিভারির সম্পূর্ণ ঠিকানা লিখুন!");
    addrEl.focus(); return;
  }

  // Update phone input value to normalized format for visual clarity
  phoneEl.value = phone;

  // Disable button
  const submitBtn = document.getElementById("btn-submit-order");
  const origHTML = submitBtn.innerHTML;
  submitBtn.disabled = true;
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
      [cfg.googleForm.entryIds.name]: name,
      [cfg.googleForm.entryIds.phone]: phone,
      [cfg.googleForm.entryIds.address]: address,
      [cfg.googleForm.entryIds.product]: productName,
      [cfg.googleForm.entryIds.quantity]: String(qty),
      [cfg.googleForm.entryIds.delivery]: delivery,
      [cfg.googleForm.entryIds.totalPrice]: String(totalPrice)
    };

    if (cfg.googleForm.entryIds.color && selectedColor) {
      fields[cfg.googleForm.entryIds.color] = selectedColor;
    }

    // Build form data for fetch fallback as well
    const formData = new URLSearchParams();
    Object.entries(fields).forEach(([id, val]) => {
      const inp = document.createElement("input");
      inp.type = "hidden"; inp.name = id; inp.value = val;
      hf.appendChild(inp);
      formData.append(id, val);
    });

    document.body.appendChild(hf);

    // Parallel background fetch for mobile in-app browsers
    try {
      fetch(cfg.googleForm.actionUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString()
      }).catch(() => {});
    } catch (err) {}

    // Fire Purchase and show Success Modal quickly (1.2s max delay for smooth UX)
    let purchaseFired = false;
    const fireSuccess = () => {
      if (purchaseFired) return;
      purchaseFired = true;

      showSuccessModal(name, phone, productName, qty, totalPrice);
      fbTrackPurchase(totalPrice, productName, qty, product.id || getActiveProductKey());
      resetForm();
      submitBtn.disabled = false;
      submitBtn.innerHTML = origHTML;
      updateOrderSummary();
      _orderSubmitting = false;

      // Cleanup elements
      setTimeout(() => {
        if (document.body.contains(hf)) document.body.removeChild(hf);
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 1000);
    };

    // onload fires when Google Form iframe gets a response
    iframe.addEventListener("load", fireSuccess, { once: true });

    // Fast Fallback: 1.2s max delay so mobile users never wait on loading spinner
    setTimeout(fireSuccess, 1200);

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
      showSuccessModal(name, phone, productName, qty, totalPrice);
      fbTrackPurchase(totalPrice, productName, qty, product.id || getActiveProductKey());
      resetForm();
      _orderSubmitting = false;  // Re-enable after dev fallback
    }, 150);
  }
}

/* ─────────────────────────────────────
   INLINE FIELD ERROR
───────────────────────────────────── */
function fieldError(el, msg) {
  // Clear previous
  el.parentNode.querySelectorAll(".field-err").forEach(e => e.remove());
  el.style.borderColor = "var(--error)";
  el.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.12)";

  const div = document.createElement("div");
  div.className = "field-err";
  div.style.cssText = "color:#dc2626;font-size:0.78rem;font-weight:600;margin-top:4px;";
  div.textContent = msg;
  el.parentNode.appendChild(div);

  el.addEventListener("input", () => {
    el.style.borderColor = "";
    el.style.boxShadow = "";
    div.remove();
  }, { once: true });
}

/* ─────────────────────────────────────
   RESET FORM
───────────────────────────────────── */
function resetForm() {
  const $ = id => document.getElementById(id);
  $("cust-name").value = "";
  $("cust-phone").value = "";
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
  $("modal-cust-name").textContent = name;
  $("modal-cust-phone").textContent = phone;
  $("modal-prod-name").textContent = product;
  $("modal-prod-qty").textContent = `${qty} টি`;
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
  const imgWrap = document.querySelector(".slider-wrap");
  if (!imgWrap || !CHAMAKDAR_CONFIG) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const p = getActiveProduct();
        fbq("track", "ViewContent", {
          content_name: p.name,
          content_ids: [p.id || getActiveProductKey()],
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

let initiateCheckoutFired = false;
function triggerInitiateCheckout() {
  if (initiateCheckoutFired) return;
  initiateCheckoutFired = true;
  fbTrackInitiateCheckout();
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
