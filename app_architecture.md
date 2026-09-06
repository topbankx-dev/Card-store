# 📱 Store App & Website Architecture Plan

This document outlines the technical architecture for building your custom Trading Card Game (TCG) store application featuring e-commerce, scheduling, and tournament management.

---

## 🛠️ The Tech Stack Recommendation: The Next.js + Postgres Stack

You asked how the stack changes with **Next.js**. 

The biggest change is that **Next.js actually eliminates the need for Express**, simplifying your entire setup into a single, unified codebase. 

Instead of traditional PERN (where you manage a separate backend and a separate frontend), your new stack looks like this:

1. **PostgreSQL (The Database):** Still your rock-solid database for inventory, orders, and tournaments.
2. **Prisma ORM (The Bridge):** We highly recommend adding Prisma. It acts as a translator between Next.js and PostgreSQL, making it incredibly easy to write database queries without raw SQL.
3. **Next.js (Frontend AND Backend):** Next.js handles the React user interface, but it *also* has built-in backend API capabilities (`app/api` routes). You don't need Express anymore. 
4. **Node.js (The Runtime):** Next.js runs on Node.js under the hood.

**The Architecture Flow:**
`PostgreSQL Database` ↔️ `Prisma ORM` ↔️ `Next.js (Server & Client)` ↔️ `Customer's Browser/Phone`

**🔥 The Modern Tweak: Use Next.js**
Instead of building a separate React frontend and Express backend, we highly recommend using **Next.js**. 
- **SEO is critical:** Standard React apps struggle with SEO. If a customer Googles "Buy Blue-Eyes White Dragon Jamaica", you want your store to show up. Next.js provides Server-Side Rendering (SSR) which makes your products easily searchable on Google.

---

## 🏗️ App Feature Breakdown & Architecture

### 1. E-Commerce & Inventory Module
- **Live Inventory Sync:** PostgreSQL database managing stock.
- **Card Search & Filters:** Filter by Game (YGO, Pokemon, MTG), Set, Rarity, and Condition.
- **Checkout System:**
  - **Shipping Options:** Local Pickup (in-store), Knutsford Express (island-wide delivery), or Tara Courier.
  - **Payment Gateways:** WiPay or NCB e-Commerce (for local Jamaican JMD cards) + Stripe (for international USD cards).

### 2. Event Schedule & Tournament Module
- **Weekly Calendar UI:** A dynamic calendar showing exactly what games are played on which days.
- **Pre-Registration:** Users can buy a "Ticket" to an event to reserve their seat before the store capacity is reached.
- **Live Brackets (Future Feature):** Build out a bracket visualization so players can check their phones to see who they are matched up against in the current round.

### 3. User Accounts & Loyalty
- **Player Profiles:** Users log in, track their past orders, view upcoming tournaments they registered for, and see their loyalty points.

---

## 🗄️ High-Level Database Schema (PostgreSQL)

To give you an idea of how your database will be structured:

*   **`users` table:** id, name, email, password_hash, role (admin/player), loyalty_points.
*   **`products` table:** id, name, game (e.g., YGO), set, condition, price, stock_quantity, image_url.
*   **`orders` table:** id, user_id, total_amount, status (pending/paid/shipped/ready_for_pickup), fulfillment_type.
*   **`events` table:** id, name, game, date, entry_fee, max_capacity, current_registered.
*   **`event_registrations` table:** id, event_id, user_id, payment_status.

---

## ⚖️ Build vs. Buy (Important Consideration)

Building a custom Next.js e-commerce app from scratch is a massive project (can take 3-6 months for a solo developer). 

**Alternative Hybrid Approach (Faster to Launch):**
1. **Storefront:** Use **Shopify** for the e-commerce side. It handles inventory, shopping carts, and payments out of the box.
2. **App/Schedule:** Build a smaller Next.js app *just* for the tournament schedules and community features. 

---

## 📱 Phase 2: The React Native Mobile App (iOS & Android)

Because you plan to release a dedicated mobile app for features like **Card Scanning** (using the phone's camera) and **Tournament Check-In** (using QR codes or location), your architecture is perfectly set up for it.

### How the Web and Mobile Apps Work Together:
Your Next.js app will act as the "Brain" (the backend API), and both the Website and the Mobile App will be the "Faces".

1. **The Shared Database (PostgreSQL):** Both apps read from the exact same inventory and user database.
2. **Next.js API Routes:** You will build endpoints in Next.js (e.g., `yoursite.com/api/tournaments`). The React Native app will fetch data from these URLs.
3. **The Monorepo Approach (Turborepo):** When you are ready to build the mobile app, you can use a tool like **Turborepo** to put both your Next.js code and your React Native code in the same project folder. This allows you to share code (like user types, colors, and business logic) between the website and the mobile app, cutting development time in half.

### Mobile-Specific Features (React Native + Expo)
- **Card Scanner (Selling/Grading):** You can use React Native camera libraries to allow users to take a picture of a card. The app can send that image to an AI or a card database API (like TCGplayer) to instantly pull up the current market price and condition guidelines.
- **Tournament Check-in:** Generate a QR code on the player's app that you scan at the counter to instantly check them into the bracket.
