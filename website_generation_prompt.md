# 🤖 AI Prompt: Card Shop Website Generation

**How to use this:** Copy the text below the line and paste it into an AI coding assistant like Cursor, Claude 3.5 Sonnet, ChatGPT, or v0.dev. It is specifically engineered to give the AI all the context we've discussed so far, ensuring it builds exactly what you need.

---

**Copy the text below:**

```text
Act as an Expert Full-Stack Next.js Developer and UX/UI Designer. 

I am building a web application for a physical Trading Card Game (TCG) store and PC Gaming Lounge based in Jamaica. 
I need you to help me build the MVP (Minimum Viable Product). 

### 🛠️ The Tech Stack
- Framework: Next.js (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- UI Components: shadcn/ui and Lucide Icons
- Database & ORM: PostgreSQL with Prisma
- Authentication: NextAuth (Auth.js)

### 📌 Architecture Rules (CRITICAL)
1. SEO is a priority. Use Next.js Server Components to fetch product data so card inventory is easily indexed by Google.
2. API-First Design: I will be building a React Native mobile app in Phase 2. Ensure that any database logic is exposed via clean REST API routes (`app/api/...`) so the future mobile app can consume the exact same data.
3. Design Vibe: Clean, modern, "gamer/esports" aesthetic. Dark mode by default. Highly mobile-responsive.

### 🎯 MVP Features Required
1. Landing Page: A hero section promoting the store, a "Weekly Tournament Schedule" section, and a "Featured Singles" carousel.
2. E-Commerce Store: A grid of products with a sidebar to filter by Game (Yu-Gi-Oh, Pokemon, MTG), Rarity, and Condition. 
3. Cart & Checkout: A slide-out shopping cart with checkout options for "In-Store Pickup" and "Island-wide Delivery". 
4. Admin Dashboard (Basic): A hidden route (`/admin`) to view recent orders and add new cards to the database.

### 📝 Step 1: Your First Task
Do not write the entire application at once. 
For your first response, I want you to:
1. Provide the complete `schema.prisma` file containing the models for `User`, `Product`, `Order`, `OrderItem`, and `Event` (for tournaments).
2. Outline the exact folder structure you plan to use for the `app/` directory.

Ask for my approval on the database schema before we begin coding the frontend UI.
```
