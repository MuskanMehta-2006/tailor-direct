
const express = require("express");
const crypto = require("crypto");
const pool = require("../db");

const router = express.Router();

const PRICES = {
  STANDARD: 169,
  PREMIUM: 219,
  LUXURY: 299
};

const VALID_STYLES = ["CLASSIC", "SLIM_FIT"];

// POST /api/orders
router.post("/", async (req, res) => {
  try {
    const {
      idempotency_key,
      tier,
      jacket_style,
      monogram,
      chest_inches
    } = req.body;

    // 1. Validate idempotency key
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (
      typeof idempotency_key !== "string" ||
      !uuidRegex.test(idempotency_key)
    ) {
      return res.status(400).json({
        error: "A valid idempotency_key UUID is required"
      });
    }

    // 2. Validate fabric tier
    if (!Object.prototype.hasOwnProperty.call(PRICES, tier)) {
      return res.status(400).json({
        error: "Invalid fabric tier"
      });
    }

    // 3. Validate jacket style
    if (!VALID_STYLES.includes(jacket_style)) {
      return res.status(400).json({
        error: "Invalid jacket style"
      });
    }

    // 4. Slim Fit is not allowed with Standard
    if (tier === "STANDARD" && jacket_style === "SLIM_FIT") {
      return res.status(400).json({
        error: "Slim Fit is available only with Premium and Luxury fabrics"
      });
    }

    // 5. Validate monogram
    let cleanMonogram = monogram;

    if (cleanMonogram === undefined || cleanMonogram === null) {
      cleanMonogram = null;
    } else if (
      typeof cleanMonogram !== "string" ||
      cleanMonogram.length > 10
    ) {
      return res.status(400).json({
        error: "Monogram must be a string with a maximum of 10 characters"
      });
    }

    if (cleanMonogram !== null) {
      cleanMonogram = cleanMonogram.trim();
      if (cleanMonogram.length === 0) {
        cleanMonogram = null;
      }
      if (cleanMonogram !== null && cleanMonogram.length > 10) {
        return res.status(400).json({
          error: "Monogram cannot exceed 10 characters"
        });
      }
    }

    // 6. Validate chest measurement
    const chest = Number(chest_inches);

    if (
      chest_inches === undefined ||
      chest_inches === null ||
      chest_inches === "" ||
      !Number.isFinite(chest) ||
      chest < 34 ||
      chest > 54
    ) {
      return res.status(400).json({
        error: "Chest measurement must be between 34 and 54 inches"
      });
    }

    // 7. Calculate price on the server
    const verifiedTotalPrice =
      PRICES[tier] + (cleanMonogram ? 15 : 0);

    // 8. Check whether this request was already processed
    const existingOrder = await pool.query(
      `SELECT ticket_id, tier, jacket_style, monogram,
              chest_inches, verified_total_price
       FROM production_tickets
       WHERE idempotency_key = $1`,
      [idempotency_key]
    );

    if (existingOrder.rows.length > 0) {
      return res.status(200).json(existingOrder.rows[0]);
    }

    // 9. Create a unique ticket ID
    const ticketId = crypto.randomUUID();

    // 10. Save order in PostgreSQL
    const insertResult = await pool.query(
      `INSERT INTO production_tickets
       (ticket_id, idempotency_key, tier, jacket_style,
        monogram, chest_inches, verified_total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING ticket_id, tier, jacket_style, monogram,
                 chest_inches, verified_total_price`,
      [
        ticketId,
        idempotency_key,
        tier,
        jacket_style,
        cleanMonogram,
        chest,
        verifiedTotalPrice
      ]
    );

    // 11. Handle simultaneous duplicate requests
    if (insertResult.rows.length === 0) {
      const duplicateOrder = await pool.query(
        `SELECT ticket_id, tier, jacket_style, monogram,
                chest_inches, verified_total_price
         FROM production_tickets
         WHERE idempotency_key = $1`,
        [idempotency_key]
      );

      return res.status(200).json(duplicateOrder.rows[0]);
    }

    return res.status(201).json(insertResult.rows[0]);

  } catch (error) {
    console.error("Order creation error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

module.exports = router;
