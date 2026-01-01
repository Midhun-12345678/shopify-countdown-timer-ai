# Shopify Countdown Timer + Analytics + AI Assistant

A Shopify app that allows merchants to create and manage countdown timers on product pages to create urgency, increase conversions, and track basic analytics. The app supports both fixed-time and evergreen (session-based) timers and includes an optional AI-assisted timer generation feature.

---

## 🚀 Features

- ⏱️ **Fixed Countdown Timers**
  - Same countdown for all visitors
  - Automatically activates and expires based on start/end time

- 🔁 **Evergreen Timers (Session-Based)**
  - Each visitor gets their own countdown
  - Stored in browser localStorage
  - Refresh-safe and resets after expiry

- 🎯 **Product Targeting**
  - Timers can be assigned to specific products
  - Only appears on matching product pages

- 📊 **Basic Analytics**
  - Impression counter tracks how many times a timer is shown

- 🤖 **AI-Assisted Timer Generation**
  - Merchants can describe promotion intent
  - AI suggests timer type, duration, and urgency copy
  - Suggestions are editable and never auto-saved

- 🛍️ **Storefront Widget**
  - Built using Shopify Theme App Extension
  - Lightweight JavaScript widget
  - Graceful failure (never breaks storefront)

---

## 🏗️ Architecture Overview

Shopify Admin (Merchant)
└── Admin UI (React + Polaris)
├── Create Timer
├── AI Suggestions
└── View Analytics

Backend (Node.js + Express)
├── Timer APIs
├── Impression Tracking
└── AI Suggestion Endpoint

Storefront (Customer)
└── Theme App Extension
├── Countdown Widget
├── Fixed Timer Logic
└── Evergreen Timer Logic

yaml
Copy code

---

## 🧩 Tech Stack

- **Shopify CLI 3.0**
- **Node.js + Express** (Backend)
- **React + Shopify Polaris** (Admin UI)
- **Theme App Extension + JavaScript** (Storefront widget)
- **In-memory storage** (MVP, replaceable with MongoDB)

---

## ⚙️ How the App Works

### 1️⃣ Admin (Merchant Side)
- Merchant opens the app from Shopify Admin
- Creates a timer by selecting:
  - Timer type (fixed / evergreen)
  - Start & end time OR duration
  - Product ID
- Optionally uses **AI Generate** to pre-fill timer details
- Saves the timer

### 2️⃣ Backend
- Stores timer configuration
- Exposes APIs:
  - Create timer
  - Fetch active timer for product
  - Track impressions
  - Generate AI suggestions

### 3️⃣ Storefront (Customer Side)
- Widget loads via Theme App Extension
- Fetches active timer for the product
- Renders countdown
- Tracks impressions
- Handles expiry and evergreen logic safely

---

## 🧪 Testing Approach

The following key scenarios were manually and logically tested:

1. Fixed timer shows only within start/end time
2. Fixed timer hides after expiry
3. Evergreen timer persists across page refresh
4. Evergreen timer resets for new visitors (incognito)
5. Timer appears only on targeted product
6. Impression counter increments on each view
7. AI suggestions are editable and not auto-saved
8. Widget fails silently if API is unavailable

---

## 🤖 AI Design Notes

- AI is **assistive only**
- AI does **not** create or publish timers automatically
- Suggestions are clearly marked as *"Suggested by AI"*
- For MVP, a rules-based AI mock is used for predictability
- Can be easily replaced with GPT-4o-mini or similar models

---

## 🔐 Security & Performance Considerations

- Shop isolation handled via Shopify session
- No sensitive data exposed on the client
- Widget is lightweight and avoids layout shifts
- Graceful error handling ensures storefront stability

---

## ⚠️ Trade-offs & Assumptions

- In-memory storage was used to prioritize speed under a tight timeline
- Product Resource Picker was replaced with manual Product ID input
- Basic analytics only (impressions), no conversion tracking
- Script loading is synchronous for MVP simplicity

All of the above can be enhanced easily in a production version.

---

## 🔮 What I’d Improve With More Time

- MongoDB persistence with proper indexing
- Product & Collection picker integration
- Advanced analytics (clicks, conversions)
- Caching & rate limiting
- Deferred script loading for performance
- Multi-timer prioritization rules

---

## ▶️ Running the App Locally

```bash
shopify app dev
