# Deployment Guide

This guide walks you through deploying the HackPass PWA to Vercel and configuring your Supabase production database.

## 1. Supabase Production Setup

1.  Create a new project in your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Navigate to the **SQL Editor** in your new project.
3.  Copy the contents of `supabase/migrations/20260524000000_schema.sql` from your repository and paste it into the SQL Editor.
4.  Run the query to create all tables, views, and Row Level Security (RLS) policies.
5.  Navigate to **Authentication > Providers** and ensure Email/Password authentication is enabled.
6.  Go to **Project Settings > API** to find your `URL`, `anon` key, and `service_role` key. Keep these handy for Vercel.

## 2. Vercel Deployment

1.  Push your code to a GitHub repository.
2.  Log in to [Vercel](https://vercel.com/) and click **Add New > Project**.
3.  Import your HackPass GitHub repository.
4.  In the **Configure Project** section, expand the **Environment Variables** menu.
5.  Add the following environment variables:

    | Name | Value | Description |
    | :--- | :--- | :--- |
    | `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase Project URL |
    | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Your Supabase Anon Key |
    | `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Your Supabase Service Role Key (Required for admin actions and API routes) |
    | `ADMIN_REGISTRATION_CODE` | `your-secret-code` | A secret passcode required for users to register as an Admin (e.g., `HACKPASS_ADMIN_2026`) |
    | `GOOGLE_CREDENTIALS` | `{...}` | (Optional) Your Google Service Account JSON string for Google Wallet integration. |

6.  Click **Deploy**. Vercel will build and deploy your application.

## 3. Post-Deployment Verification

1.  Once deployed, visit your Vercel URL.
2.  Navigate to `/auth/register` and create a student account to test standard registration.
3.  Navigate to `/auth/register?type=admin`, fill in the details, and provide the `ADMIN_REGISTRATION_CODE` you set in Vercel to verify admin creation.
4.  Test the Progressive Web App (PWA) installation by opening the site on a mobile device and selecting "Add to Home Screen".
