# Camelot Scout v6 — Deployment Guide

## Quick Deploy to Render (Static Site)

1. Connect repo: github.com/dgoldoff-hue/camelot-scout-v6
2. Build Command: `npm ci && npm run build`
3. Publish Directory: `dist`
4. Add Environment Variables in Render dashboard:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - VITE_AI_API_KEY (optional)
   - VITE_APOLLO_API_KEY (optional)
   - VITE_PROSPEO_API_KEY (optional)

## Supabase Setup (for team logins)

1. Create project at supabase.com
2. Run migrations in order: supabase/migrations/001_initial_schema.sql through 005
3. In Auth > Users, create accounts for:
   - dgoldoff@camelot.nyc (David Goldoff — Owner)
   - sam@camelot.nyc (Sam Lodge — Tech Lead)
   - carl@camelot.nyc (Carl Harkien — Sales)
   - luigi@camelot.nyc (Luigi — Operations)
4. Copy Project URL + anon key to Render env vars
5. Redeploy

## Team Access

Share URL: https://camelot-scout-v6.onrender.com

Each team member logs in with their @camelot.nyc email.
No Supabase = demo mode (everyone sees David Goldoff's view).

## Upgrading from Free to Paid Render

Free tier: spins down after 15 min inactivity (30-60 sec cold start).
Starter ($7/mo): always-on, no cold starts. Recommended for daily use.
