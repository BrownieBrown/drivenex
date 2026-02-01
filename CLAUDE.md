# DRIVENEX

A Next.js application for comparing car offers (lease, buy, subscription) with Total Cost of Ownership (TCO) calculations, tailored for the German market.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Language**: TypeScript

## Project Structure

```
src/
├── app/
│   ├── (protected)/          # Auth-required routes
│   │   ├── cars/             # Car CRUD
│   │   │   ├── [id]/         # Car detail, edit, delete
│   │   │   │   └── offers/   # Offers for a car
│   │   │   │       └── [offerId]/
│   │   │   │           └── running-costs/  # Running costs config
│   │   │   └── new/          # Add new car
│   │   ├── compare/          # TCO comparison view
│   │   ├── dashboard/        # Main dashboard
│   │   └── settings/         # User settings (fuel prices, etc.)
│   ├── auth/callback/        # Supabase auth callback
│   └── login/                # Login page
├── components/
│   ├── charts/               # Recharts components (CostChart)
│   ├── ui/                   # Reusable UI components (Button, Card, Input, Select)
│   └── Navigation.tsx        # Main navigation
├── lib/
│   ├── calculations.ts       # TCO calculation logic
│   ├── constants.ts          # German market defaults (fuel prices, tax rates, etc.)
│   └── supabase/             # Supabase client setup (client, server, middleware)
└── types/
    └── database.ts           # Database types and TypeScript interfaces
```

## Key Files

- `src/types/database.ts` - All database table types (Cars, Offers, RunningCosts, Comparisons, UserSettings)
- `src/lib/calculations.ts` - TCO calculation functions (Kfz-Steuer, insurance, fuel costs)
- `src/lib/constants.ts` - German defaults (fuel prices, SF-Klasse percentages, TÜV costs)
- `src/lib/supabase/` - Supabase client configuration for browser, server, and middleware

## Database Schema

### Tables
- **cars** - Vehicle specifications (brand, model, fuel type, power, consumption)
- **offers** - Purchase/lease offers (monthly payment, duration, included services)
- **running_costs** - Per-offer running costs (insurance, fuel prices, maintenance)
- **comparisons** - Saved comparisons of multiple offers
- **user_settings** - User preferences (default fuel prices, km/year)

### Fuel Types
- `bev` (Battery Electric Vehicle)
- `petrol`
- `diesel`
- `hybrid`

### Offer Types
- `lease`
- `buy`
- `subscription`

## Development Workflow

```bash
# Initial setup
make setup          # Copy .env.local.example and install deps

# Development
make dev            # Start dev server at http://localhost:3000
make lint           # Run ESLint
make build          # Production build
make clean          # Clean build artifacts
```

## German Market Features

- **Kfz-Steuer**: Vehicle tax calculation (BEVs tax-free until 2030)
- **SF-Klasse**: Insurance no-claims bonus levels (0-35)
- **TÜV/HU**: Vehicle inspection every 2 years (first after 3 years for new cars)
- **Fuel prices**: Default prices for petrol, diesel, and electricity

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

> Note: Use the Supabase **Publishable key** for `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

See `docs/DATABASE_SETUP.md` for complete Supabase setup instructions.
