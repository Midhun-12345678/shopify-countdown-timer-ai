Countdown Timer + Analytics + AI Assistant — Shopify App
📌 Project Overview

This project is a Shopify App that allows merchants to add countdown timers to product pages in order to create urgency and improve conversions.
The app supports both fixed-time promotions and evergreen (session-based) timers, provides basic analytics, and includes an AI-assisted timer generation feature to help merchants configure timers faster.

The solution is built using Shopify’s official Node + Express app template, follows Theme App Extension guidelines for storefront rendering, and focuses on performance, safety, and simplicity.

🧱 Architecture Overview

The application consists of three main parts:

1. Admin App (Merchant Dashboard)

Built with React + Shopify Polaris

Embedded inside Shopify Admin

Used by merchants to:

Create and configure timers

Generate timer suggestions using AI

View basic analytics (impressions)

2. Backend (Node + Express)

Handles:

Timer creation and retrieval

Active timer resolution per product

Impression tracking

AI-assisted timer suggestion API

Uses Shopify’s authentication and session handling

For MVP speed, timers are stored in-memory (easily replaceable with MongoDB)

3. Storefront Widget (Theme App Extension)

Implemented using Theme App Extension

Lightweight JavaScript widget (no React on storefront)

Injected into product pages via app block

Fetches timer configuration from backend and renders countdown safely

✨ Features Implemented
⏱ Countdown Timers

Fixed Timers

Same countdown for all users

Based on start and end datetime

Evergreen Timers

Session-based countdown per visitor

Uses localStorage

Does not reset on page refresh

Resets for new visitors or after expiry

🎯 Targeting

Timers can be assigned to specific products

Timer is displayed only when product ID matches

📊 Basic Analytics

Tracks impressions

An impression is counted when a timer is rendered on a product page

Analytics handled via backend API

🤖 AI-Assisted Timer Generation (Assistive Only)

Merchants can enter an intent (e.g. “flash sale”)

AI suggests:

Timer type (fixed / evergreen)

Duration

Basic urgency headline

AI suggestions:

Are clearly marked

Are editable

Are never auto-saved or auto-published

🔌 API Endpoints
Timer APIs

POST /api/timers
Create a new timer

GET /api/timers
List all timers for the shop

GET /api/timers/active?productId=xxx
Fetch active timer for a given product

Analytics

POST /api/timers/:id/impression
Increment impression count for a timer

AI

POST /api/ai/suggest-timer
Returns AI-generated timer suggestions (assistive only)

🧪 Testing Strategy

The project includes unit tests focused on business logic, not Shopify internals.

Covered Test Cases:

Fixed timer active within valid time range

Fixed timer excluded after expiry

Evergreen timer expiry calculation

Product ID targeting validation

Impression counter increments correctly

Testing is intentionally kept lightweight to prioritize core logic under time constraints.

⚡ Performance Considerations

Storefront widget:

Lightweight JavaScript

No React on storefront

No layout shifts (CLS-safe)

Widget gracefully fails:

No timer → renders nothing

Network/API failure → silent fail

Single optimized API call per product page

🔐 Security Considerations

Shopify session validation is used on backend

No secrets exposed to client-side code

All user inputs are sanitized

AI logic runs only on backend

🤖 AI Design Decisions

AI is used as an assistive helper, not an authority

No automatic creation or publishing of timers

AI does not invent:

Discounts

Prices

Stock levels

For this MVP:

AI behavior is rules-based / mocked

Designed to be easily replaceable with a real LLM (e.g. GPT-4o-mini)

⚖️ Trade-offs & Assumptions

Due to the limited timeline:

Timer data is stored in-memory instead of MongoDB
→ API contracts are designed to support easy DB replacement

Product selection uses manual product ID input
→ Shopify Resource Picker can be added later

Analytics are limited to impressions only
→ Clicks and conversion tracking can be added later

These decisions were made intentionally to prioritize correctness, stability, and completeness of core flows.

🚀 What I’d Improve With More Time

Replace in-memory storage with MongoDB

Add collection-based and global targeting

Add more analytics (clicks, conversions)

Add caching headers for timer fetch

Improve admin UI with better validation and UX

Integrate real LLM for AI suggestions

▶️ How to Run Locally
shopify app dev


Open the Shopify Admin app preview URL

Add the Countdown Timer app block to a product page

Create a timer from the Admin UI

View the countdown on the storefront
