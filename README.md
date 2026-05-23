# HackPass - Event Registration & QR Attendance PWA

HackPass is a premium, production-ready college event attendance, QR tracking, and ticket system. It includes both Student and Admin portals and is designed to run as a Progressive Web App (PWA).

## Features
- **Student Portal**: View events, generate QR tickets, and save tickets to Google Wallet.
- **Admin Dashboard**: Manage events, students, attendance, and analytics.
- **Gatekeeper Scanner**: Fast QR code scanner with visual and audio feedback.
- **PWA Ready**: Can be installed on mobile devices for native-like experience.

## Deployment Guide

### 1. Supabase Setup
- Create a new project on [Supabase](https://supabase.com).
- Go to the SQL Editor and run the SQL script found in `supabase/migrations/20260524000000_schema.sql` to initialize the database schema, RLS policies, and triggers.
- Under Authentication > Providers, ensure Email authentication is enabled.

### 2. Environment Variables
You need to set the following environment variables in your deployment environment (e.g., Vercel):
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase public anonymous key.

### 3. Deploying to Vercel
1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Go to [Vercel](https://vercel.com/new) and import your repository.
3. Configure your Environment Variables in the Vercel dashboard.
4. Click **Deploy**. Vercel will automatically detect Next.js and build the project using the default settings (`npm run build`).

### 4. Setting up PWA
Once deployed, open your app in Safari (iOS) or Chrome (Android) and select "Add to Home Screen" to install it as a PWA.

## Development

First, install dependencies:
```bash
npm install
```

Then, run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
