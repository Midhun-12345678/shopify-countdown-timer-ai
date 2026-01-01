# Shopify Countdown Timer App  
*(with Analytics & AI Assist)*

## Overview

This project is a Shopify App that enables merchants to add **countdown timers** to product pages to create urgency and improve conversions.

The app supports both **fixed-time promotions** and **evergreen (session-based) timers**, includes **basic impressions analytics**, and provides an **AI-assisted timer configuration** feature to speed up setup for merchants.

The focus of this implementation is **correct Shopify architecture**, **safe storefront rendering**, and **clear separation of concerns** between admin, backend, and storefront.

---

## How the App Works

The application is composed of **three logical layers**:

### Admin (Merchant-facing UI)

Merchants configure countdown timers from an embedded Shopify Admin interface built using **React + Shopify Polaris**.

From the admin UI, merchants can:
- Create fixed or evergreen timers
- Assign timers to specific products
- View basic impressions analytics
- Generate timer suggestions using AI (assistive only)

---

### Backend (Node + Express)

The backend layer is responsible for:
- Timer creation and management
- Resolving the active timer for a product
- Tracking impressions
- Providing AI-assisted timer suggestions

Shopify authentication and session handling are managed using Shopify’s official Node + Express template.

---

### Storefront (Theme App Extension)

A lightweight JavaScript widget is injected into product pages using a **Theme App Extension**.

The widget:
- Fetches active timer data from the backend
- Renders the countdown safely on the storefront
- Fails gracefully without impacting store performance

---

## Key Features

### Countdown Timers

- **Fixed Timer**
  - Same countdown for all users
  - Based on start and end datetime

- **Evergreen Timer**
  - Session-based countdown per visitor
  - Stored using `localStorage`
  - Does not reset on page refresh
  - Resets for new visitors or after expiry

---

### Targeting

- Timers can be assigned to **specific products**
- The timer renders only when the product context matches

---

### Analytics

- Tracks **impressions**
- An impression is recorded whenever a timer is rendered on a product page
- Analytics logic is handled server-side

---

### AI-Assisted Timer Generation

- Merchants provide a short intent (e.g. *“flash sale”*)
- AI suggests:
  - Timer type
  - Duration
  - Basic urgency copy
- AI outputs are:
  - Clearly marked as suggestions
  - Fully editable
  - Never auto-saved or auto-published

---

## API Summary

### Timers
- `POST /api/timers` – Create a timer
- `GET /api/timers` – List timers
- `GET /api/timers/active?productId=...` – Fetch active timer for a product

### Analytics
- `POST /api/timers/:id/impression` – Increment impression count

### AI
- `POST /api/ai/suggest-timer` – Generate AI-based timer suggestions (assistive only)

---

## Testing Approach

Testing focuses on **core business logic** rather than Shopify internals or UI rendering.

Covered cases include:
- Fixed timer validity within time window
- Fixed timer expiry handling
- Evergreen timer expiry calculation
- Product targeting validation
- Impression counter increment logic

---

## Performance & Safety

- Storefront widget uses **plain JavaScript**
- No layout shifts (CLS-safe)
- Single API call per product page
- Silent failure handling:
  - No active timer → nothing rendered
  - API/network failure → widget fails gracefully
- No sensitive data exposed to storefront

---

## AI Design Notes

AI is designed to be **assistive**, not authoritative.

- AI never auto-creates or publishes timers
- AI does not invent discounts, prices, or stock levels
- Current implementation uses **rules-based / mocked AI**
- Easily replaceable with a real LLM (e.g. GPT-4o-mini)

---

## Trade-offs & Assumptions

Due to time constraints:
- Timer data is stored **in-memory** instead of MongoDB  
- Product selection uses manual product ID input  
- Analytics are limited to impressions only  

These trade-offs prioritize **correctness, stability, and complete end-to-end flow**.

---

## What I Would Improve With More Time

- Persistent storage using MongoDB
- Collection-level and global timer targeting
- Additional analytics (clicks, conversions)
- API caching and rate limiting
- Improved admin UI validations
- Integration with a production LLM

---

## Running the App Locally

```bash
shopify app dev
