# HackPass

**Live Demo:** [Click me 🐇](https://e-hackpass.vercel.app)

HackPass is a complete production-ready Progressive Web App (PWA) designed for college event attendance, QR tracking, and Google Wallet integration. It provides a premium, mobile-first experience for both students and event administrators.

## Features

*   **Student Portal:**
    *   Browse upcoming college events.
    *   Register for events and generate unique QR code tickets.
    *   Add event tickets directly to Google Wallet.
    *   View past attendance and certificates.
*   **Admin Dashboard:**
    *   Create and manage college events.
    *   Built-in QR scanner for rapid check-ins.
    *   Real-time attendance tracking and analytics.
    *   Manage student registrations.
*   **Premium Design:**
    *   Modern glassmorphism UI with a custom color palette (Brown, Black, Red, Yellow on a Light Background).
    *   Smooth micro-animations and responsive layouts.
*   **PWA Capabilities:**
    *   Installable on iOS and Android devices.
    *   Offline caching via service workers.
*   **Secure:**
    *   Powered by Supabase Authentication and Row Level Security (RLS).
    *   Role-based access control (Student vs. Admin).

## Tech Stack

*   **Frontend:** Next.js (App Router), React, TypeScript, TailwindCSS
*   **Backend:** Next.js Server Actions & API Routes
*   **Database:** Supabase (PostgreSQL)
*   **Authentication:** Supabase Auth
*   **Deployment:** Vercel

## Local Development

### Prerequisites

*   Node.js 18+
*   npm or yarn
*   A Supabase project

### Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/hackpass.git
    cd hackpass
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Copy the `.env.example` file to `.env.local` and fill in your Supabase credentials:
    ```bash
    cp .env.example .env.local
    ```
    *Required variables:*
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `SUPABASE_SERVICE_ROLE_KEY`
    *   `ADMIN_REGISTRATION_CODE` (Used to authorize new admin accounts)

4.  **Run Database Migrations:**
    Execute the SQL schema found in `supabase/migrations/20260524000000_schema.sql` in your Supabase project's SQL editor to create the necessary tables and RLS policies.

5.  **Start the development server:**
    ```bash
    npm run dev
    ```

6.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

Please refer to the [DEPLOYMENT.md](./DEPLOYMENT.md) guide for instructions on deploying HackPass to Vercel and configuring the production environment.
