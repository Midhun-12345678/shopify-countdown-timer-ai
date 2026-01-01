import { Router } from "express";

const router = Router();

router.post("/suggest-timer", (req, res) => {
  try {
    const { intent, productTitle } = req.body || {};

    if (!intent || typeof intent !== "string") {
      return res
        .status(400)
        .json({ error: "'intent' is required and must be a string" });
    }

    const trimmedIntent = intent.trim();
    if (!trimmedIntent) {
      return res
        .status(400)
        .json({ error: "'intent' must not be empty" });
    }

    if (trimmedIntent.length > 200) {
      return res
        .status(400)
        .json({ error: "'intent' must be at most 200 characters" });
    }

    const safeIntent = trimmedIntent.replace(/\s+/g, " ");

    const lower = safeIntent.toLowerCase();
    const isFlashy = /flash|limited|today only|ends soon/.test(lower);

    let type = "evergreen";
    let durationMinutes = 30;

    if (isFlashy) {
      type = "fixed";
      durationMinutes = 120;
    }

    const baseHeadline =
      type === "fixed"
        ? "Limited-time offer: ends soon!"
        : "Special offer available for a short time.";

    const headline = productTitle
      ? `${baseHeadline} ${productTitle}`
      : baseHeadline;

    return res.status(200).json({
      type,
      durationMinutes,
      headline,
    });
  } catch (error) {
    console.error("Error in /api/ai/suggest-timer:", error);
    return res.status(500).json({ error: "Failed to generate timer suggestion" });
  }
});

export default router;
