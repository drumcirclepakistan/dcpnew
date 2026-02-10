# Drum Circle Pakistan - Band Management System

## Overview
A modern, mobile-friendly band management web app for Drum Circle Pakistan. Currently built for founder-only access with show management features. Future phases will add band member management, invoices, and quotations.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui components
- **Backend**: Express.js with session-based authentication
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: wouter (frontend), Express (backend)
- **State**: TanStack React Query

## Key Features
- Session-based login (founder account: username `founder`, password `drumcircle2024`)
- Dashboard with stats (total shows, upcoming, revenue, pending payments)
- Full show CRUD (add, view, edit, delete)
- Show types: Corporate, Private, Public, University
- Organization tracking for Corporate/University shows
- Financial tracking: total amount, advance payment, pending amount
- Dark mode toggle
- Responsive sidebar navigation

## Project Structure
- `shared/schema.ts` - Drizzle schemas for users and shows, Zod validation
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage interface with DatabaseStorage implementation
- `server/routes.ts` - API routes (auth + shows CRUD)
- `server/seed.ts` - Seed data for founder account and sample shows
- `client/src/lib/auth.tsx` - Auth context provider
- `client/src/components/app-sidebar.tsx` - Sidebar navigation
- `client/src/components/theme-toggle.tsx` - Dark/light mode toggle
- `client/src/pages/` - Login, Dashboard, Shows, ShowForm, ShowDetail pages

## API Routes
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `GET /api/shows` - List all shows (authenticated)
- `GET /api/shows/:id` - Get show detail
- `POST /api/shows` - Create show
- `PATCH /api/shows/:id` - Update show
- `DELETE /api/shows/:id` - Delete show

## User Preferences
- Pakistani Rupees (Rs) for currency
- Show types: Corporate, Private, Public, University
- Organization name tracked for Corporate and University shows
