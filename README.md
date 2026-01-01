# ShoApp – Shopify Countdown Timer App

ShoApp is a Shopify embedded app that lets merchants create countdown timers for products and display them on the storefront via a Theme App Extension.

It supports:
- Fixed timers
- Evergreen (per-visitor) timers
- A simple admin UI to create timers
- A theme app extension countdown widget
- Basic impressions tracking
- AI-assisted timer suggestions (currently via a rules-based or pluggable LLM backend)

---

## 1. Prerequisites

- Node.js 18+ installed
- Shopify CLI installed and logged in (`shopify login`)
- A Shopify Partner account and a dev store

---

## 2. Project structure

Key paths:

- `shopify.app.toml` – app configuration (org, app, dev store, scopes)
- `web/` – Node + Express backend and Shopify app wiring
  - `web/index.js` – Express app entrypoint
  - `web/shopify.js` – Shopify App configuration and auth
  - `web/routes/timers.js` – Timer APIs (fixed + evergreen + impressions)
  - `web/routes/ai.js` – AI-assisted timer suggestion API
- `web/frontend/` – Embedded admin UI (React + Polaris)
  - `web/frontend/pages/CreateTimer.jsx` – single admin page to create timers
- `extensions/countdown-timer/` – Theme app extension for storefront widget
  - `blocks/star_rating.liquid` – now used as the Countdown Timer block
  - `assets/countdown.js` – storefront countdown widget logic

The root `package.json` wires everything via Shopify workspaces.

---

## 3. Getting started (local dev)

From the app root:

```powershell
cd "D:\SHo-app\sho-app\sho-app"
npm install
npm run dev   # runs `shopify app dev`
```

Follow the CLI prompts to:
- Select your organization and app
- Select / create a dev store
- (If your storefront is password protected) enter the **Online Store password** from `Admin → Online Store → Preferences`.

When ready, the CLI will show a preview URL and your app will be available inside your dev store’s **Apps** section.

---

## 4. Backend APIs

All APIs are mounted under `/api` in `web/index.js`.

### 4.1 Timers API – `web/routes/timers.js`

In-memory `timers` array is used (no database yet).

**Create timer**

- `POST /api/timers`
- JSON body (fixed example):

```json
{
  "name": "Flash Sale",
  "startAt": "2026-01-01T10:00:00Z",
  "endAt": "2026-01-01T12:00:00Z",
  "productId": "1234567890",
  "type": "fixed"
}
```

**Evergreen example**:

```json
{
  "name": "Evergreen Offer",
  "productId": "1234567890",
  "type": "evergreen",
  "durationMinutes": 30
}
```

- Required: `name`, `productId`.
- Fixed timers require valid `startAt` and `endAt` dates.
- Evergreen timers ignore `startAt`/`endAt` on the server and instead expose `durationMinutes`.
- Response: the created timer object, including `id`, `type`, `durationMinutes`, `impressions`, etc.

**List timers**

- `GET /api/timers`
- Returns the full in-memory `timers` array.

**Get active timer for a product**

- `GET /api/timers/active?productId=...`
- For fixed timers: returns the first timer where `startAt <= now <= endAt`.
- For evergreen timers: treats matching timers as active; per-visitor expiry is handled by the storefront widget.
- Returns:
  - `200` + timer JSON if found
  - `204` if no active timer

**Track impressions**

- `POST /api/timers/:id/impression`
- Increments `timer.impressions` and returns `{ impressions: <number> }`.
- Called from the storefront widget once per page load when a timer is successfully rendered.

### 4.2 AI Suggestion API – `web/routes/ai.js`

**Endpoint**

- `POST /api/ai/suggest-timer`

**Request body**

```json
{
  "intent": "Flash sale for new product launch",
  "productTitle": "Optional Product Title"
}
```

Validation:
- `intent` is required string
- Trimmed, max length 200 chars

Response shape:

```json
{
  "type": "fixed" | "evergreen",
  "durationMinutes": 30,
  "headline": "Generic urgency headline..."
}
```

Implementation notes:
- Currently implemented as rules-based / mock AI.
- Designed so it can be swapped out for a real LLM using environment variables (e.g. `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`) without exposing secrets to the frontend.
- The endpoint **never auto-creates timers**; it only returns suggestions.

---

## 5. Admin UI – Create Timer page

File: `web/frontend/pages/CreateTimer.jsx`

Features:
- Single Polaris page inside Shopify Admin.
- Fields:
  - Timer name
  - Timer type: `fixed` or `evergreen`
  - For fixed: `startAt`, `endAt` (`datetime-local` inputs)
  - For evergreen: `durationMinutes` (number)
  - `productId` (manual input; copy from product URL or GID)
- Actions:
  - **Save Timer** – calls `POST /api/timers`.
  - **Generate with AI** – calls `POST /api/ai/suggest-timer` with an intent string.

AI section:
- `AI intent (optional)` TextField (max 200 chars).
- **Generate with AI** button:
  - Sends `{ intent, productTitle: name }` to `/api/ai/suggest-timer`.
  - On success, pre-fills:
    - `type`
    - `durationMinutes`
    - Shows an info banner with `headline` labelled “Suggested by AI”.
- All fields remain editable and **nothing is auto-saved**; merchant must click **Save Timer**.

To access the page in Admin:
- Open the app from Shopify Admin.
- Use the nav link pointing to `/createTimer` (configured in `web/frontend/App.jsx`).

---

## 6. Storefront countdown widget

Theme app extension: `extensions/countdown-timer/`

### 6.1 Block (Liquid)

File: `extensions/countdown-timer/blocks/star_rating.liquid` (repurposed as Countdown Timer block):

- Renders a root div:

```liquid
<div
  id="countdown-timer-root"
  data-product-id="{{ product.id }}"
  data-shop="{{ shop.permanent_domain }}">
</div>

{{ 'countdown.js' | asset_url | script_tag }}
```

- Schema declares the block as **Countdown Timer** app block.

### 6.2 Widget JS

File: `extensions/countdown-timer/assets/countdown.js`

Behavior:
- Reads `productId` from `#countdown-timer-root`.
- Calls `GET /api/timers/active?productId=...`.
- Handles two timer types:
  - **Fixed**:
    - Uses `timer.endAt` as the expiry time.
  - **Evergreen**:
    - Uses `timer.id` and `timer.durationMinutes` with `localStorage`.
    - Storage key: `evergreen_timer_<timer.id>`.
    - Per visitor:
      - If a stored future expiry exists → use it.
      - Otherwise → set `expiry = now + durationMinutes` and store it.
- Renders text like:

```text
🔥 Offer ends in: 01h 23m 10s
```

- Updates every second via `setInterval`.
- When countdown reaches zero:
  - Hides the timer element.
  - For evergreen: removes the `localStorage` key.
- Tracks impressions:
  - Once per page load, after a valid timer is found, calls:

```js
fetch(`/api/timers/${timer.id}/impression`, { method: "POST" });
```

- Fully wrapped in `try/catch` and swallows errors to avoid breaking the storefront.

### 6.3 Adding the block to a theme

1. Run dev:

```powershell
cd "D:\SHo-app\sho-app\sho-app"
shopify app dev
```

2. In Shopify Admin:
   - Go to **Online Store → Themes → Customize**.
   - Open a **Product** template.
   - Add an **App block** and select **Countdown Timer** from this app.

3. Create a timer in Admin (`/createTimer`) for the product’s `productId`.
4. View the product page on the storefront to see the countdown.

---

## 7. Evergreen behavior summary

- Each visitor gets their own countdown for evergreen timers.
- Timer starts when they first see the product (based on `localStorage`).
- Refreshing does not reset the timer.
- New visitor (incognito browser) gets a fresh countdown.
- Expired timers hide themselves on that visitor’s browser.

---

## 8. Analytics behavior summary

- Only metric: `impressions` per timer.
- Incremented once per page load when the countdown widget successfully renders for that timer.
- Stored in-memory in the `timers` array for now.

You can inspect via:

```powershell
# from the app root, using the embedded app's authenticated session
# example in browser console from Admin app:
fetch("/api/timers").then(r => r.json()).then(console.log);
```

---

## 9. AI behavior summary

- AI suggestions are handled entirely on the backend by `/api/ai/suggest-timer`.
- Frontend only sends `intent` (and optionally `productTitle`) and receives a plain JSON suggestion.
- No API keys or secrets are exposed to the browser.
- Current implementation is rules-based and safe under time pressure, but the endpoint is designed so it can be wired to a real LLM later.

---

## 10. Notes and next steps

Possible future improvements:
- Persist timers in a real database (e.g. MongoDB or PostgreSQL) instead of memory.
- Add a Shopify Product Picker to the admin UI instead of manual `productId` entry.
- Add multi-timer management UI (list, edit, delete).
- Plug `/api/ai/suggest-timer` into a real LLM provider using environment variables.
- Add tests for `timers.js`, `ai.js`, and the countdown widget.
