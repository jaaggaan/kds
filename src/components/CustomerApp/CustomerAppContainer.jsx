import React, { useState, useEffect } from "react";
import { useResto } from "../../context/RestoContext";
import {
  Wifi,
  ShoppingBag,
  Search,
  CheckCircle,
  Clock,
  QrCode,
  CreditCard,
  Banknote,
  Star,
  Plus,
  Minus,
  X,
  ChefHat,
  Bell,
  Hand,
  ArrowRight,
  Filter,
  Flame,
  Camera,
  Check,
  AlertTriangle
} from "lucide-react";

export const CustomerAppContainer = () => {
  const {
    menuItems,
    categories,
    createOrder,
    tables,
    activeOrders,
    updateOrderStatus,
    submitCustomerFeedback
  } = useResto();

  // Navigation sub-screens for Customer App:
  // 1: portal, 2: table_confirm, 3: menu, 4: tracking, 5: bill_pay, 6: feedback
  const [screen, setScreen] = useState("portal");
  const [selectedTable, setSelectedTable] = useState(() => {
    return localStorage.getItem("truffles_guest_table") || "T5";
  });
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Save guest table selection to localStorage
  useEffect(() => {
    if (selectedTable) {
      localStorage.setItem("truffles_guest_table", selectedTable);
    }
  }, [selectedTable]);

  // Search, Filter, Sort in Menu
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState("popular"); // popular | price_asc | price_desc

  // Customization Bottom Sheet state
  const [selectedDish, setSelectedDish] = useState(null);
  const [dishQty, setDishQty] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [dishNotes, setDishNotes] = useState("");

  // Cart Drawer State
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [cart, setCart] = useState([]);

  // Active Order tracking
  const [activeOrderId, setActiveOrderId] = useState(null);

  // Bill & Pay state
  const [payMethod, setPayMethod] = useState("upi");
  const [isSplitBill, setIsSplitBill] = useState(false);
  const [splitPeople, setSplitPeople] = useState(2);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Feedback state
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Table active order check
  const existingOrderForTable = activeOrders.find(
    (o) => o.tableId === selectedTable && o.status !== "Cancelled"
  );

  // Handle Bottom Sheet Customization Add
  const handleOpenCustomization = (dish) => {
    setSelectedDish(dish);
    setDishQty(1);
    setSelectedAddons([]);
    setDishNotes("");
  };

  const handleAddonToggle = (addon) => {
    if (selectedAddons.some((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleConfirmAddToCart = () => {
    if (!selectedDish) return;
    const itemTotal =
      (selectedDish.price +
        selectedAddons.reduce((sum, a) => sum + a.price, 0)) *
      dishQty;

    const cartEntry = {
      cartId: `citem-${Date.now()}-${Math.random()}`,
      id: selectedDish.id,
      name: selectedDish.name,
      basePrice: selectedDish.price,
      qty: dishQty,
      addons: selectedAddons,
      notes: dishNotes,
      total: itemTotal,
      image: selectedDish.image
    };

    setCart([...cart, cartEntry]);
    setSelectedDish(null);
  };

  // Cart calculation
  const cartSubtotal = cart.reduce((sum, item) => sum + item.total, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    const orderItems = cart.map((i) => ({
      id: `oi-${Date.now()}-${Math.random()}`,
      menuItemId: i.id,
      name: i.name,
      price: i.basePrice + i.addons.reduce((s, a) => s + a.price, 0),
      qty: i.qty,
      customizations: i.addons.map((a) => a.name)
    }));

    const newOrdId = await createOrder({
      tableId: selectedTable,
      items: orderItems,
      guests: 2,
      notes: cart.map((c) => c.notes).filter(Boolean).join("; ")
    });

    setActiveOrderId(newOrdId);
    setCart([]);
    setShowCartDrawer(false);
    setScreen("tracking");
  };

  // Filtered & Sorted Menu Items
  const processedMenuItems = menuItems
    .filter((item) => {
      const matchCat = activeCategory === "all" || item.categoryId === activeCategory;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchVeg = !vegOnly || item.isVeg;
      return matchCat && matchSearch && matchVeg;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      return 0; // popular default
    });

  // Current tracked order
  const trackedOrder = activeOrders.find((o) => o.id === activeOrderId) || existingOrderForTable;

  // Bill tax calculations
  const orderSubtotal = trackedOrder
    ? trackedOrder.items.reduce((s, i) => s + i.price * i.qty, 0)
    : 0;
  const cgst = orderSubtotal * 0.025;
  const sgst = orderSubtotal * 0.025;
  const serviceCharge = orderSubtotal * 0.05;
  const grandTotal = Math.round(orderSubtotal + cgst + sgst + serviceCharge);
  const perPersonAmount = Math.ceil(grandTotal / Math.max(1, splitPeople));

  const handlePaySuccess = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      if (trackedOrder) {
        updateOrderStatus(trackedOrder.id, "Paid");
      }
      setScreen("feedback");
    }, 1500);
  };

  return (
    <div className="customer-app-wrapper fade-in">
      {/* SCREEN 1: CAPTIVE PORTAL */}
      {screen === "portal" && (
        <div className="customer-screen-card portal-splash">
          <div className="splash-content">
            <h1 className="brand-truffles-title" style={{ fontSize: "32px" }}>TRUFFLES</h1>
            <p className="brand-truffles-tagline">ORDER. EAT. REPEAT.</p>

            <div className="wifi-hero-icon">
              <Wifi size={48} color="#FF6B35" />
            </div>

            <h2>Welcome to Truffles</h2>
            <p className="body-text" style={{ textAlign: "center" }}>
              Connect to <strong>Truffles-Free-WiFi</strong> to order directly from your table with zero waiting time.
            </p>

            <div className="form-group" style={{ width: "100%", marginTop: "16px" }}>
              <label className="caption-text">Select Your Table Number:</label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Table {t.number} ({t.id})
                  </option>
                ))}
              </select>
            </div>

            <label className="checkbox-container" style={{ fontSize: "12px", color: "#B0B0C0" }}>
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
              />
              <span>I agree to Wi-Fi Terms of Service & Privacy Policy</span>
            </label>

            <button
              className="btn-primary"
              style={{ width: "100%", marginTop: "12px" }}
              disabled={!agreedTerms}
              onClick={() => setScreen("table_confirm")}
            >
              Start Ordering <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: TABLE CONFIRM */}
      {screen === "table_confirm" && (
        <div className="customer-screen-card table-confirm-splash">
          <div className="splash-content">
            <div className="table-badge-large">
              <span>TABLE</span>
              <strong>{selectedTable}</strong>
            </div>

            <h2>You are at Table {selectedTable} — Koramangala Branch</h2>

            {existingOrderForTable ? (
              <div className="warning-callout">
                <AlertTriangle size={24} color="#FACC15" />
                <div>
                  <strong>Active Order Exists</strong>
                  <p className="caption-text">
                    This table currently has an active order ({existingOrderForTable.id}). You can view status or append items.
                  </p>
                </div>
              </div>
            ) : (
              <p className="body-text" style={{ textAlign: "center" }}>
                Browse our digital menu, customize your favorite items, and send your order straight to the kitchen display!
              </p>
            )}

            <div className="confirm-actions-group">
              {existingOrderForTable && (
                <button
                  className="btn-secondary"
                  style={{ width: "100%" }}
                  onClick={() => {
                    setActiveOrderId(existingOrderForTable.id);
                    setScreen("tracking");
                  }}
                >
                  View Active Order ({existingOrderForTable.id})
                </button>
              )}

              <button
                className="btn-primary"
                style={{ width: "100%" }}
                onClick={() => setScreen("menu")}
              >
                Browse Digital Menu <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 3: MENU BROWSER */}
      {screen === "menu" && (
        <div className="customer-menu-view fade-in">
          {/* Header */}
          <div className="menu-sticky-header">
            <div>
              <h1 className="brand-truffles-title" style={{ fontSize: "20px" }}>TRUFFLES</h1>
              <span className="caption-text">Table {selectedTable} • Koramangala</span>
            </div>

            <button
              className="cart-icon-btn"
              onClick={() => setShowCartDrawer(true)}
            >
              <ShoppingBag size={22} color="#FF6B35" />
              {cart.length > 0 && <span className="cart-badge-count">{cart.length}</span>}
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="search-filter-section">
            <div className="search-input-box">
              <Search size={16} color="#666680" />
              <input
                type="text"
                placeholder="Search burgers, pizzas, drinks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-controls-row">
              <label className="toggle-chip">
                <input
                  type="checkbox"
                  checked={vegOnly}
                  onChange={(e) => setVegOnly(e.target.checked)}
                />
                <span className="dot-veg"></span> Veg Only
              </label>

              <select
                className="sort-dropdown"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="popular">Popularity</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            {/* Horizontal Category Scroll */}
            <div className="category-scroll-bar">
              <button
                className={`cat-pill ${activeCategory === "all" ? "active" : ""}`}
                onClick={() => setActiveCategory("all")}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`cat-pill ${activeCategory === c.id ? "active" : ""}`}
                  onClick={() => setActiveCategory(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="menu-items-grid">
            {processedMenuItems.map((dish, idx) => (
              <div key={dish.id} className="dish-item-card" onClick={() => handleOpenCustomization(dish)}>
                <div className="dish-img-box">
                  <img src={dish.image} alt={dish.name} />
                  <span className={`veg-indicator-dot ${dish.isVeg ? "veg" : "nonveg"}`}>
                    <span className="dot-inner"></span>
                  </span>
                  {idx < 2 && <span className="bestseller-badge"><Flame size={10} /> BEST SELLER</span>}
                </div>

                <div className="dish-info-box">
                  <h3 className="dish-name">{dish.name}</h3>
                  <p className="caption-text">{dish.description}</p>
                  <div className="dish-footer-row">
                    <span className="price-mono">₹{dish.price}</span>
                    <button className="btn-secondary add-btn-sm">
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Cart Bar */}
          {cart.length > 0 && (
            <div className="floating-cart-bar" onClick={() => setShowCartDrawer(true)}>
              <div>
                <span className="caption-text">{cart.reduce((s, i) => s + i.qty, 0)} ITEMS</span>
                <div className="price-mono" style={{ fontSize: "18px" }}>₹{cartSubtotal}</div>
              </div>
              <button className="btn-primary">
                View Cart <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* SCREEN 4: ITEM DETAIL / CUSTOMIZATION BOTTOM SHEET */}
      {selectedDish && (
        <div className="bottom-sheet-backdrop" onClick={() => setSelectedDish(null)}>
          <div className="bottom-sheet-content fade-in" onClick={(e) => e.stopPropagation()}>
            <button className="icon-btn-close sheet-close" onClick={() => setSelectedDish(null)}>
              <X size={20} />
            </button>

            <img src={selectedDish.image} alt={selectedDish.name} className="sheet-image" />

            <div className="sheet-body">
              <div className="sheet-title-row">
                <h2>{selectedDish.name}</h2>
                <span className="price-mono" style={{ fontSize: "20px" }}>₹{selectedDish.price}</span>
              </div>
              <p className="body-text">{selectedDish.description}</p>

              {/* Addons Customizations Checkboxes */}
              {selectedDish.customizations && selectedDish.customizations.length > 0 && (
                <div className="customizations-section">
                  <label className="caption-text" style={{ fontWeight: 600 }}>CUSTOMIZATIONS & EXTRAS</label>
                  <div className="addons-checkbox-list">
                    {selectedDish.customizations.map((addon) => {
                      const isSelected = selectedAddons.some((a) => a.id === addon.id);
                      return (
                        <label key={addon.id} className={`addon-checkbox-card ${isSelected ? "selected" : ""}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleAddonToggle(addon)}
                          />
                          <span className="addon-name">{addon.name}</span>
                          <span className="price-mono" style={{ fontSize: "14px" }}>+₹{addon.price}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="special-notes-box">
                <label className="caption-text">Special Instructions:</label>
                <textarea
                  placeholder="e.g. Less spicy, extra sauce on side..."
                  rows={2}
                  value={dishNotes}
                  onChange={(e) => setDishNotes(e.target.value)}
                />
              </div>

              {/* Qty & Add to Cart Footer */}
              <div className="sheet-footer-controls">
                <div className="qty-picker">
                  <button onClick={() => setDishQty(Math.max(1, dishQty - 1))}>
                    <Minus size={14} />
                  </button>
                  <span className="price-mono">{dishQty}</span>
                  <button onClick={() => setDishQty(dishQty + 1)}>
                    <Plus size={14} />
                  </button>
                </div>

                <button className="btn-primary" style={{ flex: 1 }} onClick={handleConfirmAddToCart}>
                  Add to Cart • ₹
                  {(selectedDish.price + selectedAddons.reduce((s, a) => s + a.price, 0)) * dishQty}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 5: CART DRAWER */}
      {showCartDrawer && (
        <div className="bottom-sheet-backdrop" onClick={() => setShowCartDrawer(false)}>
          <div className="bottom-sheet-content cart-drawer-content fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Your Order Basket</h2>
              <button className="icon-btn-close" onClick={() => setShowCartDrawer(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="cart-drawer-body">
              {cart.length === 0 ? (
                <div className="empty-cart-view">
                  <ShoppingBag size={48} color="#666680" />
                  <p className="body-text">Your cart is empty.</p>
                  <button className="btn-primary" onClick={() => setShowCartDrawer(false)}>
                    Browse Menu
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.cartId} className="cart-drawer-item">
                    <img src={item.image} alt={item.name} className="cart-item-thumb" />
                    <div className="cart-item-info">
                      <span className="cart-item-title">{item.name}</span>
                      {item.addons.length > 0 && (
                        <span className="caption-text">
                          {item.addons.map((a) => a.name).join(", ")}
                        </span>
                      )}
                      <span className="price-mono">₹{item.total}</span>
                    </div>

                    <div className="qty-picker">
                      <button onClick={() => {
                        const updated = cart.map(c => c.cartId === item.cartId ? { ...c, qty: c.qty - 1, total: (c.basePrice + c.addons.reduce((s,a)=>s+a.price,0)) * (c.qty - 1) } : c).filter(c => c.qty > 0);
                        setCart(updated);
                      }}>
                        <Minus size={12} />
                      </button>
                      <span className="price-mono" style={{ fontSize: "13px" }}>{item.qty}</span>
                      <button onClick={() => {
                        const updated = cart.map(c => c.cartId === item.cartId ? { ...c, qty: c.qty + 1, total: (c.basePrice + c.addons.reduce((s,a)=>s+a.price,0)) * (c.qty + 1) } : c);
                        setCart(updated);
                      }}>
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="subtotal-row">
                  <span>Subtotal Amount</span>
                  <span className="timer-stats-mono" style={{ fontSize: "20px" }}>₹{cartSubtotal}</span>
                </div>

                <button className="btn-primary" style={{ width: "100%" }} onClick={handlePlaceOrder}>
                  Place Order to Kitchen <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SCREEN 6: ORDER TRACKING */}
      {screen === "tracking" && trackedOrder && (
        <div className="customer-screen-card order-tracking-view fade-in">
          <div className="tracking-header">
            <h2>Order Status</h2>
            <span className="badge-tag active">{trackedOrder.id} • Table {trackedOrder.tableId}</span>
          </div>

          {/* Vertical Progress Bar */}
          <div className="status-progress-vertical">
            {[
              { stage: "New", label: "Confirmed", icon: CheckCircle },
              { stage: "In Kitchen", label: "Preparing in Kitchen", icon: ChefHat },
              { stage: "Ready", label: "Ready for Pickup", icon: Bell },
              { stage: "Served", label: "Served to Table", icon: Hand }
            ].map((st, idx) => {
              const stagesOrder = ["New", "In Kitchen", "Ready", "Served", "Payment Pending", "Paid"];
              const currentIdx = stagesOrder.indexOf(trackedOrder.status);
              const stepIdx = stagesOrder.indexOf(st.stage);

              const isDone = currentIdx > stepIdx;
              const isCurrent = currentIdx === stepIdx;

              const IconComp = st.icon;

              return (
                <div key={st.stage} className={`progress-step-row ${isCurrent ? "current" : isDone ? "done" : "pending"}`}>
                  <div className="step-icon-circle">
                    <IconComp size={18} />
                  </div>
                  <div className="step-info">
                    <span className="step-label">{st.label}</span>
                    <span className="caption-text">
                      {isCurrent ? "In progress..." : isDone ? "Completed" : "Pending"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="tracked-items-summary">
            <span className="caption-text">ORDER SUMMARY</span>
            {trackedOrder.items.map((i, idx) => (
              <div key={idx} className="summary-item-line">
                <span>{i.qty}x {i.name}</span>
                <span className="price-mono">₹{i.price * i.qty}</span>
              </div>
            ))}
          </div>

          <div className="tracking-actions-row">
            <button className="btn-secondary" onClick={() => setScreen("menu")}>
              + Order More Items
            </button>
            <button className="btn-primary" onClick={() => setScreen("bill_pay")}>
              Proceed to Bill & Pay <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 7: BILL & PAY */}
      {screen === "bill_pay" && trackedOrder && (
        <div className="customer-screen-card bill-pay-view fade-in">
          <h2>Your Final Bill</h2>
          <span className="caption-text">Table {selectedTable} • Order {trackedOrder.id}</span>

          <div className="bill-items-list">
            {trackedOrder.items.map((item, idx) => (
              <div key={idx} className="bill-item-row">
                <span>{item.qty}x {item.name}</span>
                <span className="price-mono">₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>

          <div className="bill-taxes-box">
            <div className="calc-row"><span>Subtotal</span><span>₹{orderSubtotal}</span></div>
            <div className="calc-row"><span>CGST (2.5%)</span><span>₹{cgst.toFixed(2)}</span></div>
            <div className="calc-row"><span>SGST (2.5%)</span><span>₹{sgst.toFixed(2)}</span></div>
            <div className="calc-row"><span>Service Charge (5%)</span><span>₹{serviceCharge.toFixed(2)}</span></div>
            <div className="calc-row grand-total"><span>Grand Total</span><span className="timer-stats-mono" style={{ fontSize: "22px" }}>₹{grandTotal}</span></div>
          </div>

          {/* Split Bill Toggle */}
          <div className="split-bill-section">
            <label className="checkbox-container">
              <input type="checkbox" checked={isSplitBill} onChange={(e) => setIsSplitBill(e.target.checked)} />
              <span>Split Bill Among Guests</span>
            </label>

            {isSplitBill && (
              <div className="split-controls">
                <span>Guests Count:</span>
                <div className="qty-picker">
                  <button onClick={() => setSplitPeople(Math.max(2, splitPeople - 1))}>-</button>
                  <span className="price-mono">{splitPeople}</span>
                  <button onClick={() => setSplitPeople(splitPeople + 1)}>+</button>
                </div>
                <span className="timer-stats-mono" style={{ fontSize: "16px" }}>₹{perPersonAmount}/person</span>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="payment-options-grid">
            <button className={`pay-opt ${payMethod === "upi" ? "active" : ""}`} onClick={() => setPayMethod("upi")}>
              <QrCode size={20} /> UPI QR
            </button>
            <button className={`pay-opt ${payMethod === "card" ? "active" : ""}`} onClick={() => setPayMethod("card")}>
              <CreditCard size={20} /> Card
            </button>
            <button className={`pay-opt ${payMethod === "cash" ? "active" : ""}`} onClick={() => setPayMethod("cash")}>
              <Banknote size={20} /> Cash
            </button>
          </div>

          {paymentSuccess ? (
            <div className="success-banner">
              <CheckCircle size={32} color="#7EE787" />
              <strong style={{ color: "#7EE787" }}>Payment Confirmed! Thank you for dining with Truffles!</strong>
            </div>
          ) : (
            <button className="btn-primary" style={{ width: "100%", marginTop: "12px" }} onClick={handlePaySuccess}>
              Pay ₹{isSplitBill ? perPersonAmount : grandTotal} Now
            </button>
          )}
        </div>
      )}

      {/* SCREEN 8: FEEDBACK */}
      {screen === "feedback" && (
        <div className="customer-screen-card feedback-view fade-in">
          <div className="feedback-content">
            <h2>How was your experience?</h2>
            <p className="caption-text">Your feedback helps us make Truffles better everyday!</p>

            {/* 5 Star Rating Selector */}
            <div className="star-rating-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`star-btn ${rating >= star ? "filled" : ""}`}
                  onClick={() => setRating(star)}
                >
                  <Star size={28} fill={rating >= star ? "#FF6B35" : "none"} color={rating >= star ? "#FF6B35" : "#666680"} />
                </button>
              ))}
            </div>

            <div className="form-group" style={{ width: "100%" }}>
              <label className="caption-text">Comments & Suggestions:</label>
              <textarea
                rows={3}
                placeholder="Tell us what you loved or how we can improve..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
              />
            </div>

            <button className="btn-secondary" style={{ width: "100%" }}>
              <Camera size={16} /> Add a Photo (Optional)
            </button>

            {feedbackSubmitted ? (
              <div className="success-banner">
                <CheckCircle size={24} color="#7EE787" />
                <span style={{ color: "#7EE787" }}>Thank you! Redirecting...</span>
              </div>
            ) : (
              <button
                className="btn-primary"
                style={{ width: "100%", marginTop: "12px" }}
                onClick={async () => {
                  setFeedbackSubmitted(true);
                  await submitCustomerFeedback({
                    orderId: trackedOrder?.id,
                    rating,
                    comment: feedbackComment
                  });
                  setTimeout(() => setScreen("portal"), 2500);
                }}
              >
                Submit Feedback
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
