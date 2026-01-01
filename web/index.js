// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import timersRouter from "./routes/timers.js";
import aiRouter from "./routes/ai.js";
import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Simple request logger
app.use((req, _res, next) => {
  console.log(`[backend] ${req.method} ${req.url}`);
  next();
});

// Simple request logger
app.use((req, _res, next) => {
  console.log(`[backend] ${req.method} ${req.url}`);
  next();
});

// 🔥 FIXED ORDER: JSON parsing + PUBLIC APIs FIRST
app.use(express.json());
app.use("/api/timers", timersRouter); // public timers API
app.use("/api/ai", aiRouter); // public AI suggestions (no secrets)

// Set up Shopify authentication and webhook handling (after public APIs)
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// 🔥 PROTECTED API ROUTES - AFTER public timers
app.use("/api/*", shopify.validateAuthenticatedSession());

// Protected routes (these need auth - fine as-is)
app.get("/api/products/count", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const countData = await client.request(`
    query shopifyProductCount {
      productsCount {
        count
      }
    }
  `);

  res.status(200).send({ count: countData.data.productsCount.count });
});

app.post("/api/products", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));
app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

console.log(`🚀 Backend server starting on port ${PORT}`);
app.listen(PORT);
