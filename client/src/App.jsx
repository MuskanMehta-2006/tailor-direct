import { useState, useRef, useEffect } from "react";
import "./App.css";
import SuitViewer from "./SuitViewer.jsx";

const fabrics = [
  { id: "STANDARD", name: "Essential Wool", subtitle: "Everyday refinement", price: 169, color: "#77766f", texture: "Fine wool", tag: "The Essential" },
  { id: "PREMIUM", name: "Italian Wool", subtitle: "A sharper statement", price: 219, color: "#343b43", texture: "Italian wool", tag: "Most chosen" },
  { id: "LUXURY", name: "Signature Wool", subtitle: "Made for distinction", price: 299, color: "#242a31", texture: "Luxury wool", tag: "The Signature" },
];

const fits = [
  { id: "CLASSIC", name: "Classic fit", description: "A timeless, comfortable silhouette." },
  { id: "SLIM", name: "Slim fit", description: "A clean, contemporary silhouette." },
];

const company = {
  name: "SSQUAD VENTURES",
  email: "studio@tailordirect.example",
  phone: "+91 00000 00000",
  address: "Customer Experience Studio",
  website: "Tailor Direct",
};

const CHEST_MIN = 34;
const CHEST_MAX = 54;
const CHEST_ERROR = "Please enter chest size between 34 and 54 inches.";

const fitLabel = (id) => (id === "SLIM" ? "Slim fit" : "Classic fit");

function App() {
  const [tier, setTier] = useState("PREMIUM");
  const [jacketStyle, setJacketStyle] = useState("CLASSIC");
  const [monogram, setMonogram] = useState("");
  const [chest, setChest] = useState("40");
  const [chestError, setChestError] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const idempotencyKeyRef = useRef(crypto.randomUUID());
  const audioRef = useRef(null);

  const selectedFabric = fabrics.find((f) => f.id === tier) || fabrics[1];
  const totalPrice = selectedFabric.price + (monogram.trim() ? 15 : 0);

  useEffect(() => {
    if (!contactOpen) return;
    const onKey = (e) => e.key === "Escape" && setContactOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [contactOpen]);

  // Escape closes the order dialogs and the page does not scroll behind them
  useEffect(() => {
    if (!confirmOpen && !successOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setConfirmOpen(false);
        setSuccessOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [confirmOpen, successOpen]);

  // Success chime (generated in the browser, no audio file needed)
  const primeAudio = () => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioRef.current) audioRef.current = new AC();
      audioRef.current.resume?.();
    } catch {
      /* sound is optional */
    }
  };

  const playSuccess = () => {
    try {
      const ctx = audioRef.current;
      if (!ctx) return;
      const t = ctx.currentTime;
      [
        [659.25, 0],
        [783.99, 0.12],
        [1046.5, 0.24],
        [1318.5, 0.4],
      ].forEach(([freq, delay]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.28, t + delay + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + delay);
        osc.stop(t + delay + 0.75);
      });
    } catch {
      /* sound is optional */
    }
  };

  const newKey = () => {
    idempotencyKeyRef.current = crypto.randomUUID();
  };

  const clearConfirmation = () => {
    setOrderMessage("");
    setOrderSuccess(false);
    setOrderData(null);
  };

  const changeTier = (next) => {
    if (next === tier) return;
    setTier(next);
    if (next === "STANDARD") setJacketStyle("CLASSIC");
    newKey();
    clearConfirmation();
  };

  const changeFit = (next) => {
    if (next === jacketStyle) return;
    setJacketStyle(next);
    newKey();
    clearConfirmation();
  };

  const changeMonogram = (next) => {
    if (next === monogram) return;
    setMonogram(next);
    newKey();
    clearConfirmation();
  };

  // Live validation: only digits, max 2 digits, instant error outside 34-54
  const changeChest = (next) => {
    // Block letters, e, +, -, . etc.
    if (!/^\d*$/.test(next)) return;

    // No valid chest value has more than 2 digits
    if (next.length > 2) {
      setChestError(CHEST_ERROR);
      return;
    }

    if (next === chest) return;
    setChest(next);

    if (next === "") {
      setChestError("");
    } else {
      const value = Number(next);
      if (next.length === 1) {
        // Only 3, 4, 5 can lead to a valid 2-digit value (34-54)
        setChestError(value >= 3 && value <= 5 ? "" : CHEST_ERROR);
      } else {
        setChestError(value < CHEST_MIN || value > CHEST_MAX ? CHEST_ERROR : "");
      }
    }

    newKey();
    clearConfirmation();
  };

  // Step 1: validate, then ask "Are you sure?"
  const openConfirm = () => {
    if (loading) return;

    const chestValue = Number(chest);
    if (!Number.isInteger(chestValue) || chestValue < CHEST_MIN || chestValue > CHEST_MAX) {
      setChestError(CHEST_ERROR);
      setOrderMessage(CHEST_ERROR);
      setOrderSuccess(false);
      return;
    }
    if (monogram.trim().length > 10) {
      setOrderMessage("Monogram can contain up to 10 characters.");
      setOrderSuccess(false);
      return;
    }

    setChestError("");
    setOrderMessage("");
    setConfirmOpen(true);
  };

  // Step 2: "Yes" places the order
  const confirmAndPlace = () => {
    primeAudio();
    setConfirmOpen(false);
    handlePlaceOrder();
  };

  const goToInvoice = () => {
    setSuccessOpen(false);
    setTimeout(() => {
      document.getElementById("confirmation")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handlePlaceOrder = async () => {
    if (loading) return;

    const chestValue = Number(chest);
    if (!Number.isInteger(chestValue) || chestValue < CHEST_MIN || chestValue > CHEST_MAX) {
      setChestError(CHEST_ERROR);
      setOrderMessage(CHEST_ERROR);
      setOrderSuccess(false);
      return;
    }
    if (monogram.trim().length > 10) {
      setOrderMessage("Monogram can contain up to 10 characters.");
      setOrderSuccess(false);
      return;
    }

    setLoading(true);
    clearConfirmation();

    try {
      const key = idempotencyKeyRef.current;
      const response = await fetch("https://YOUR-RENDER-URL.onrender.com/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify({
          idempotency_key: key,
          tier,
          jacket_style: jacketStyle === "SLIM" ? "SLIM_FIT" : "CLASSIC",
          monogram: monogram.trim(),
          chest_inches: chestValue,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Unable to place order.");
      }

      setOrderData({
        ticketId: data.ticket_id || "TD-CONFIRMED",
        fabric: selectedFabric.name,
        jacketStyle,
        monogram: monogram.trim() || "None",
        chest: chestValue,
        total: Number(data.verified_total_price ?? totalPrice),
        date: new Date().toLocaleString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      setOrderSuccess(true);
      setOrderMessage("Your order request has been placed.");

      setSuccessOpen(true);
      playSuccess();
    } catch (error) {
      setOrderSuccess(false);
      setOrderMessage(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const createAnother = () => {
    newKey();
    clearConfirmation();
    document.getElementById("top")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="tailor-app">
      <div className="announcement-bar">
        <span>Made to measure</span>
        <span className="announcement-right">Personal fit. Timeless style.</span>
      </div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Tailor Direct home">
          <span className="brand-mark">TD</span>
          <span className="brand-lockup">
            <span className="brand-name">Tailor Direct</span>
            <span className="brand-subtitle">by Ssquad Ventures</span>
          </span>
        </a>

        <nav className="header-nav" aria-label="Primary">
          <a href="#fabrics">Fabrics</a>
          <a href="#fit">Fit &amp; details</a>
          <a href="#order">Your order</a>
          <a href="#about">Our promise</a>
        </nav>

        <button type="button" className="header-contact" onClick={() => setContactOpen(true)}>
          Contact <span aria-hidden="true">↗</span>
        </button>
      </header>

      <main id="top">
        <section className="intro-section">
          <h1>
            Made for you.
            <span>Made to last.</span>
          </h1>
          <div className="intro-side">
            <p>
              A suit should feel like it was always yours. Choose your fabric,
              find your fit, and make the details your own.
            </p>
            <ol className="intro-steps">
              <li>Choose your fabric</li>
              <li>Find your fit</li>
              <li>Make it yours</li>
            </ol>
          </div>
        </section>

        <section className="configurator-layout">
          {/* LEFT: 3D PREVIEW */}
          <div className="viewer-column">
            <div className="viewer-shell">
              <div className="stage-backdrop" aria-hidden="true">
                <span className="stage-light" />
                <div className="stage-brand">
                  <span className="stage-brand-top">Made to measure</span>
                  <strong>
                    Tailor
                    <br />
                    <span>Direct</span>
                  </strong>
                  <span className="stage-brand-by">
                    <i />
                    by Ssquad Ventures
                    <i />
                  </span>
                </div>
                <span className="stage-side stage-side-left">Crafted around you</span>
                <span className="stage-side stage-side-right">Personal fit. Timeless style.</span>
                <span className="stage-floor" />
              </div>

              <SuitViewer tier={tier} jacketStyle={jacketStyle} />

              <div className="viewer-overlay viewer-overlay-bottom">
                <span className="viewer-hint">
                  <b aria-hidden="true">↻</b>
                  Drag to rotate
                  <em />
                  Scroll to zoom
                </span>
              </div>

              <div className="viewer-watermark" aria-hidden="true">TD</div>
            </div>

            <div className="trust-strip">
              <div>
                <span className="trust-icon">✦</span>
                <div>
                  <strong>Made to order</strong>
                  <small>Designed around your choice</small>
                </div>
              </div>
              <div>
                <span className="trust-icon">◇</span>
                <div>
                  <strong>Personal details</strong>
                  <small>Your fit, your signature</small>
                </div>
              </div>
              <div>
                <span className="trust-icon">✓</span>
                <div>
                  <strong>Order verified</strong>
                  <small>Details checked at checkout</small>
                </div>
              </div>
            </div>

            <div className="craft-note">
              <h3>Considered in every detail</h3>
              <p>
                Fabric, fit, and finishing come together around the way you want
                to wear your suit.
              </p>
            </div>
          </div>

          {/* RIGHT: CUSTOMIZATION */}
          <div className="selection-column">
            <section className="selection-section" id="fabrics">
              <div className="section-heading">
                <h2>Choose your fabric</h2>
                <span className="section-counter">3 options</span>
              </div>

              <div className="fabric-list">
                {fabrics.map((fabric) => {
                  const selected = tier === fabric.id;
                  return (
                    <button
                      type="button"
                      key={fabric.id}
                      className={`fabric-card ${selected ? "selected" : ""}`}
                      onClick={() => changeTier(fabric.id)}
                      aria-pressed={selected}
                    >
                      <span className="fabric-swatch" style={{ backgroundColor: fabric.color }}>
                        <span>{fabric.texture}</span>
                      </span>

                      <span className="fabric-card-content">
                        <span className="fabric-tag">{fabric.tag}</span>
                        <h3>{fabric.name}</h3>
                        <p>{fabric.subtitle}</p>
                      </span>

                      <span className="fabric-price">${fabric.price}</span>
                      <span className="radio">{selected && <span />}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="selection-section" id="fit">
              <div className="section-heading">
                <h2>Find your fit</h2>
                <span className="section-counter">Your silhouette</span>
              </div>

              <div className="fit-options">
                {fits.map((fit) => {
                  const disabled = tier === "STANDARD" && fit.id === "SLIM";
                  const selected = jacketStyle === fit.id;
                  return (
                    <button
                      type="button"
                      key={fit.id}
                      className={`fit-card ${selected ? "selected" : ""}`}
                      disabled={disabled}
                      onClick={() => changeFit(fit.id)}
                      aria-pressed={selected}
                    >
                      <span className="fit-card-top">
                        <span className="radio">{selected && <span />}</span>
                        <span className="fit-name">{fit.name}</span>
                      </span>
                      <span className="fit-description">
                        {disabled ? "Available with Italian and Signature wool." : fit.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="selection-section">
              <div className="section-heading">
                <h2>Personal details</h2>
                <span className="section-counter">Make it yours</span>
              </div>

              <div className="field-grid">
                <div className="field">
                  <label className="field-label" htmlFor="monogram">
                    Monogram <span>Optional · +$15</span>
                  </label>
                  <div className="input-wrap">
                    <input
                      id="monogram"
                      type="text"
                      value={monogram}
                      maxLength={10}
                      placeholder="e.g. S.G."
                      onChange={(e) => changeMonogram(e.target.value)}
                    />
                    <span>{monogram.length}/10</span>
                  </div>
                  <p className="field-hint">Add initials for a personal finishing touch.</p>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="chest">
                    Chest measurement <span>Inches</span>
                  </label>
                  <div className="input-wrap">
                    <input
                      id="chest"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      value={chest}
                      aria-invalid={!!chestError}
                      aria-describedby="chest-hint"
                      onChange={(e) => changeChest(e.target.value)}
                      onBlur={() => {
                        const v = Number(chest);
                        if (chest === "" || v < CHEST_MIN || v > CHEST_MAX) {
                          setChestError(CHEST_ERROR);
                        }
                      }}
                    />
                    <span>in</span>
                  </div>
                  <p
                    id="chest-hint"
                    className="field-hint"
                    style={chestError ? { color: "#c0392b", fontWeight: 500 } : undefined}
                    role={chestError ? "alert" : undefined}
                  >
                    {chestError || "Enter a measurement from 34 to 54 inches."}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>

        {/* ORDER SUMMARY */}
        <section className="order-card" id="order">
          <div className="order-summary-content">
            <div className="order-summary-details">
              <h2>Order summary</h2>
              <div className="order-line">
                <span>{selectedFabric.name}</span>
                <span>${selectedFabric.price}</span>
              </div>
              <div className="order-line">
                <span>{fitLabel(jacketStyle)}</span>
                <span>Included</span>
              </div>
              <div className="order-line">
                <span>Monogram</span>
                <span>{monogram.trim() ? "$15" : "—"}</span>
              </div>
              <div className="order-line">
                <span>Chest</span>
                <span>{chest || "—"} in</span>
              </div>
            </div>

            <div className="order-action">
              <div className="order-total">
                <span>Estimated total</span>
                <strong>${totalPrice}</strong>
              </div>

              <button
                type="button"
                className="place-order-button"
                onClick={openConfirm}
                disabled={loading}
              >
                <span>{loading ? "Placing order…" : "Place order"}</span>
                <span className="order-arrow" aria-hidden="true">↗</span>
              </button>

              {orderMessage && !orderSuccess && (
                <div className="order-message error" role="status">
                  {orderMessage}
                </div>
              )}
            </div>
          </div>

          <div className="order-card-bottom">
            <span>✓ Your order details are verified before submission.</span>
            <span>Secure order request · No payment collected in this demo</span>
          </div>
        </section>

        {orderSuccess && orderData && (
          <section className="confirmation-section" id="confirmation" aria-live="polite">
            <div className="confirmation-card">
              <div className="success-check">
                <svg viewBox="0 0 52 52" aria-hidden="true">
                  <circle cx="26" cy="26" r="24" />
                  <path d="M14 27.5l8 8L38 19" />
                </svg>
              </div>

              <span className="section-kicker">Order confirmed</span>
              <h2>Your order is placed.</h2>
              <p className="confirmation-lead">
                Thank you for choosing Tailor Direct. Your design details have
                been sent for production review.
              </p>

              <div className="confirmation-ticket">
                <span>Production ticket</span>
                <strong>{orderData.ticketId}</strong>
                <small>{orderData.date}</small>
              </div>

              <div className="invoice">
                <div className="invoice-header">
                  <div>
                    <strong>Tailor Direct</strong>
                    <small>by Ssquad Ventures</small>
                  </div>
                  <span>Order invoice</span>
                </div>

                <div className="invoice-company">
                  <span>{company.name}</span>
                  <span>{company.address}</span>
                  <span>{company.email} · {company.phone}</span>
                </div>

                <div className="invoice-row"><span>Fabric</span><strong>{orderData.fabric}</strong></div>
                <div className="invoice-row"><span>Fit</span><strong>{fitLabel(orderData.jacketStyle)}</strong></div>
                <div className="invoice-row"><span>Monogram</span><strong>{orderData.monogram}</strong></div>
                <div className="invoice-row"><span>Chest measurement</span><strong>{orderData.chest} in</strong></div>
                <div className="invoice-row invoice-total">
                  <span>Verified order total</span>
                  <strong>${orderData.total}</strong>
                </div>

                <div className="invoice-footer">
                  This is an order confirmation for the configurator demo. It is
                  not a payment receipt.
                </div>
              </div>

              <button type="button" className="new-design-button" onClick={createAnother}>
                Create another design <span aria-hidden="true">↗</span>
              </button>
            </div>
          </section>
        )}

        <section className="promise-section" id="about">
          <div className="promise-heading">
            <span className="section-kicker">The Tailor Direct promise</span>
            <h2>Good style is personal.</h2>
            <p>
              Every choice is yours. We bring the details together into one
              considered design.
            </p>
          </div>

          <div className="promise-grid">
            <article>
              <span>01</span>
              <h3>Your design</h3>
              <p>Choose the fabric and silhouette that match your style.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Your measurements</h3>
              <p>Share your measurements to help guide the fit process.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Your order</h3>
              <p>Review your selections before sending your order request.</p>
            </article>
          </div>
        </section>

        <section className="company-section" id="contact">
          <div className="company-intro">
            <span className="section-kicker">Company &amp; customer care</span>
            <h2>The art of looking your best.</h2>
            <p>
              We believe a well-made suit should feel personal. From the fabric
              you choose to the final fit, every detail begins with your
              individual style.
            </p>
          </div>

          <div className="company-cards">
            <article className="company-card">
              <span className="company-card-label">The house</span>
              <h3>{company.name}</h3>
              <p>Tailor Direct · Made-to-measure menswear</p>
              <div className="company-card-detail">
                <span>Studio</span>
                <strong>{company.address}</strong>
              </div>
              <div className="company-card-detail">
                <span>Our approach</span>
                <strong>Thoughtful design. Personal service.</strong>
              </div>
            </article>

            <article className="company-card">
              <span className="company-card-label">Contact</span>
              <h3>Customer care</h3>
              <p>Questions about your design or order? We are happy to help.</p>
              <div className="company-card-detail">
                <span>Email</span>
                <strong>{company.email}</strong>
              </div>
              <div className="company-card-detail">
                <span>Phone</span>
                <strong>{company.phone}</strong>
              </div>
              <small className="demo-contact-note">
                Demo contact details. Replace with verified company information
                before publishing.
              </small>
            </article>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="footer-brand" href="#top">
          Tailor Direct
          <small>by Ssquad Ventures</small>
        </a>
        <span>Crafted around you</span>
        <span>© 2026 Ssquad Ventures</span>
      </footer>

      {/* CONFIRM ORDER DIALOG */}
      {confirmOpen && (
        <div className="dialog-backdrop" role="presentation" onClick={() => setConfirmOpen(false)}>
          <section
            className="dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="dialog-icon" aria-hidden="true">?</span>
            <h2 id="confirm-title">Confirm your order?</h2>
            <p>Are you sure you want to place this order? Please check your selection once more.</p>

            <div className="dialog-summary">
              <div><span>Fabric</span><strong>{selectedFabric.name}</strong></div>
              <div><span>Fit</span><strong>{fitLabel(jacketStyle)}</strong></div>
              <div><span>Monogram</span><strong>{monogram.trim() || "None"}</strong></div>
              <div><span>Chest</span><strong>{chest} in</strong></div>
              <div className="dialog-total"><span>Total</span><strong>${totalPrice}</strong></div>
            </div>

            <div className="dialog-actions">
              <button type="button" className="btn-ghost" onClick={() => setConfirmOpen(false)}>
                No, go back
              </button>
              <button type="button" className="btn-gold" autoFocus onClick={confirmAndPlace}>
                Yes, place order
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ORDER PLACED DIALOG */}
      {successOpen && orderData && (
        <div className="dialog-backdrop" role="presentation" onClick={() => setSuccessOpen(false)}>
          <section
            className="dialog dialog-success"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="success-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="success-burst" aria-hidden="true">
              <svg viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="24" />
                <path d="M14 27.5l8 8L38 19" />
              </svg>
            </div>
            <h2 id="success-title">Your order is placed</h2>
            <p>Thank you for choosing Tailor Direct. Your design details are with our production team.</p>

            <div className="dialog-ticket">
              <span>Production ticket</span>
              <strong>{orderData.ticketId}</strong>
            </div>

            <div className="dialog-actions">
              <button type="button" className="btn-ghost" onClick={() => setSuccessOpen(false)}>
                Close
              </button>
              <button type="button" className="btn-gold" autoFocus onClick={goToInvoice}>
                Go to invoice
              </button>
            </div>
          </section>
        </div>
      )}

      {/* CONTACT DRAWER */}
      {contactOpen && (
        <div className="contact-backdrop" onClick={() => setContactOpen(false)} role="presentation">
          <section
            className="contact-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="contact-close"
              aria-label="Close contact panel"
              onClick={() => setContactOpen(false)}
            >
              ×
            </button>

            <span className="section-kicker">Tailor Direct · Customer care</span>
            <h2 id="contact-modal-title">
              We're here <em>to help.</em>
            </h2>
            <p className="contact-modal-intro">
              Get in touch with us for questions about your design,
              measurements or order.
            </p>

            <div className="contact-modal-list">
              <div className="contact-modal-item"><span>Company</span><strong>{company.name}</strong></div>
              <div className="contact-modal-item">
                <span>Email</span>
                <a href={`mailto:${company.email}`}>{company.email}</a>
              </div>
              <div className="contact-modal-item">
                <span>Phone</span>
                <a href={`tel:${company.phone.replace(/\s/g, "")}`}>{company.phone}</a>
              </div>
              <div className="contact-modal-item"><span>Studio</span><strong>{company.address}</strong></div>
              <div className="contact-modal-item"><span>Brand</span><strong>{company.website}</strong></div>
            </div>

            <div className="contact-modal-footer">
              <span>Personal service</span>
              <span>Thoughtful design</span>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
