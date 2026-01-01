import { Router } from "express";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// In‑memory storage
export const timers = [];

// Helper to get shop from query/header
function getShopFromRequest(req) {
  const queryShopRaw = req.query.shop;
  const headerShopRaw = req.headers["x-shop-domain"];

  const queryShop = Array.isArray(queryShopRaw)
    ? queryShopRaw[0]
    : queryShopRaw;

  const headerShop = Array.isArray(headerShopRaw)
    ? headerShopRaw[0]
    : headerShopRaw;

  return queryShop || headerShop || "demo-store";
}

// POST /api/timers
router.post("/", (req, res) => {
  try {
    console.log("POST /api/timers hit");
    console.log("  headers:", req.headers);
    console.log("  body:", req.body);

    const { name, startAt, endAt, productId, type, durationMinutes } =
      req.body || {};

    const missing = [];
    if (!name) missing.push("name");
    if (!productId) missing.push("productId");

    // For fixed timers we require explicit start/end dates.
    // For evergreen timers, frontend will compute expiry client-side.
    const isEvergreen = type === "evergreen";
    if (!isEvergreen) {
      if (!startAt) missing.push("startAt");
      if (!endAt) missing.push("endAt");
    }

    if (missing.length > 0) {
      console.log("  validation failed, missing:", missing);
      return res
        .status(400)
        .json({ error: `Missing required fields: ${missing.join(", ")}` });
    }

    let start = null;
    let end = null;

    if (!isEvergreen) {
      start = new Date(startAt);
      end = new Date(endAt);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        console.log("  invalid dates:", { startAt, endAt });
        return res
          .status(400)
          .json({ error: "Invalid date format for startAt or endAt" });
      }
    }

    const shop = getShopFromRequest(req);

    const timer = {
      id: uuidv4(),
      shop,
      name,
      type: isEvergreen ? "evergreen" : "fixed",
      // For evergreen timers, start/end are not used by the storefront logic
      // but we keep them nullable for consistency.
      startAt: start,
      endAt: end,
      productId,
      durationMinutes: isEvergreen
        ? Number.isFinite(Number(durationMinutes))
          ? Number(durationMinutes)
          : null
        : null,
      impressions: 0,
      createdAt: new Date(),
    };

    timers.push(timer);
    console.log("  timer created:", timer);

    return res.status(201).json(timer);
  } catch (err) {
    console.error("Error creating timer:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/timers
router.get("/", (_req, res) => {
  try {
    console.log("GET /api/timers hit, count:", timers.length);
    return res.status(200).json(timers);
  } catch (err) {
    console.error("Error listing timers:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/timers/active?productId=...
router.get("/active", (req, res) => {
  try {
    const productIdRaw = req.query.productId;
    const productId = Array.isArray(productIdRaw)
      ? productIdRaw[0]
      : productIdRaw;

    console.log("GET /api/timers/active hit, productId:", productId);

    if (!productId) {
      return res
        .status(400)
        .json({ error: "Missing required query parameter: productId" });
    }

    const now = new Date();

    const activeTimer = timers.find((t) => {
      if (t.productId !== productId) return false;

      // Evergreen timers are always considered "active" –
      // the storefront widget handles per-visitor expiry.
      if (t.type === "evergreen") {
        return true;
      }

      return (
        t.startAt instanceof Date &&
        t.endAt instanceof Date &&
        now >= t.startAt &&
        now <= t.endAt
      );
    });

    if (!activeTimer) {
      console.log("  no active timer found");
      return res.status(204).send();
    }

    console.log("  active timer found:", activeTimer);
    return res.status(200).json(activeTimer);
  } catch (err) {
    console.error("Error getting active timer:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/timers/:id/impression
router.post("/:id/impression", (req, res) => {
  try {
    const { id } = req.params;

    const timer = timers.find((t) => t.id === id);
    if (!timer) {
      return res.status(404).json({ error: "Timer not found" });
    }

    if (typeof timer.impressions !== "number" || isNaN(timer.impressions)) {
      timer.impressions = 0;
    }

    timer.impressions += 1;

    return res.status(200).json({ impressions: timer.impressions });
  } catch (err) {
    console.error("Error tracking timer impression:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;