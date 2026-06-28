# NCDEP Platform - Developer Handover Document

## Project Overview

**Project Name:** National Cooperative Discovery & Exchange Platform (NCDEP)
**Repository:** https://github.com/agrihqafrica-max/ncdep
**Status:** Fully implemented, build verified, ready for deployment

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/agrihqafrica-max/ncdep.git
cd ncdep

# Install dependencies
npm install

# Set up environment variables (see Environment Setup below)
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev

# Build for production
npm run build
```

---

## Environment Setup

Create a `.env` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DB_URL=your_supabase_database_url
```

**Note:** The Supabase project is already provisioned. Credentials should be obtained from the project administrator or Supabase dashboard.

---

## Architecture Summary

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Backend/Database:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM v7
- **Icons:** Lucide React
- **Security:** Row Level Security (RLS) on all tables

### Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components (ProtectedRoute)
│   ├── engagement/     # Phase 2-3 engagement features (ratings, reviews, QR, widgets)
│   └── shared/         # Reusable UI components (Button, Card, Modal, Navigation)
├── hooks/              # Custom React hooks for data access
├── lib/                # Utility libraries (Supabase client)
├── pages/
│   ├── admin/          # Admin dashboard pages ( CRUD for all entities)
│   ├── auth/           # Auth pages (Login, Register, Password Reset)
│   ├── cooperative/    # Cooperative forms
│   ├── dashboard/      # User dashboards (Cooperative, Admin)
│   ├── product/        # Product management pages
│   └── public/         # Public-facing pages (Home, Listings, Details)
└── types/              # TypeScript type definitions

supabase/
├── functions/          # Edge functions (admin-delete-user)
└── migrations/         # Database migration files (001-007)
```

---

## Implementation Phases

### Phase 1: Core Platform
- Cooperative registration and management
- Product catalog with images
- User authentication (email/password)
- Public discovery pages

**Key Files:**
- `supabase/migrations/001_initial_schema.sql`
- `src/hooks/useAuth.tsx`, `useCooperative.ts`, `useProduct.ts`
- `src/pages/public/CooperativesPage.tsx`, `ProductsPage.tsx`

### Phase 2: Engagement System
- QR code generation and scan tracking
- Product ratings (1-5 stars)
- Product reviews with moderation
- Interest/marking system
- Platform-wide analytics

**Key Files:**
- `supabase/migrations/003_phase2_engagement_tables.sql`
- `src/hooks/useEngagement.ts`
- `src/components/engagement/` (QRCodeModal, RatingDisplay, ReviewList)

### Phase 3: Event & Discovery Activation
- Event creation and management
- Event participants and products
- Campaign system for product promotion
- Discovery leaderboard (demand, scans, ratings, reviews)
- Public event directory

**Key Files:**
- `supabase/migrations/005_phase3_event_platform.sql`
- `src/hooks/useEvent.ts`, `useEventAnalytics.ts`
- `src/pages/admin/AdminEventsPage.tsx`, `EventFormPage.tsx`
- `src/components/engagement/DiscoveryLeaderboard.tsx`

### Phase 4: Buyer Opportunities & Market Linkages
- Buyer profiles and verification
- Opportunity posting with categories
- Cooperative response workflow (submit, shortlist, award)
- Response evaluation system
- Market analytics dashboard

**Key Files:**
- `supabase/migrations/006_phase4_market_linkages.sql`
- `src/hooks/useBuyer.ts`, `useOpportunity.ts`, `useOpportunityResponse.ts`
- `src/pages/admin/AdminBuyersPage.tsx`, `AdminOpportunitiesPage.tsx`

### Phase 5: NCDE Distribution Network
- Retail outlet directory and management
- Distribution partner management
- Aggregation centers (warehousing)
- Distribution request system
- Product availability widgets
- NCDE analytics dashboard

**Key Files:**
- `supabase/migrations/007_phase5_ncde_distribution.sql`
- `src/hooks/useNCDE.ts`, `useNCDEAnalytics.ts`
- `src/pages/admin/AdminRetailOutletsPage.tsx`, `AdminDistributionPartnersPage.tsx`
- `src/components/engagement/ProductAvailabilityWidget.tsx`

---

## Database Schema Overview

### Core Tables
- `users` - User accounts (managed by Supabase Auth)
- `cooperatives` - Cooperative organizations
- `products` - Product catalog
- `product_images` - Product image gallery

### Engagement Tables (Phase 2)
- `qr_scans` - QR scan tracking
- `product_ratings` - Star ratings
- `product_reviews` - User reviews
- `product_interest` - Interest/marking

### Event Tables (Phase 3)
- `events` - Events
- `event_participants` - Event participation
- `event_products` - Products at events
- `campaigns` - Marketing campaigns

### Market Linkage Tables (Phase 4)
- `buyers` - Buyer organizations
- `opportunities` - Market opportunities
- `opportunity_responses` - Cooperative responses

### Distribution Tables (Phase 5)
- `retail_outlets` - Retail locations
- `product_availability` - Availability at outlets
- `distribution_partners` - Distribution partners
- `product_distributors` - Product-distributor relationships
- `aggregation_centers` - Warehousing centers
- `distribution_requests` - Distribution requests

---

## User Roles & Permissions

### Public (Unauthenticated)
- Browse cooperatives, products, events, opportunities
- View public profiles and listings
- Register account

### Authenticated User (Cooperative)
- Manage their cooperative profile
- Add/edit products
- View product performance analytics
- Register for events
- Respond to opportunities
- Submit distribution requests

### Admin
- Full CRUD on all entities
- User management
- Review moderation
- Analytics dashboard access
- Event and campaign management

---

## Key Routes

### Public Routes
- `/` - Homepage
- `/cooperatives` - Cooperative directory
- `/cooperatives/:id` - Cooperative detail
- `/products` - Product directory
- `/products/:id` - Product detail
- `/events` - Event directory
- `/events/:id` - Event detail
- `/buyers` - Buyer directory
- `/opportunities` - Opportunity directory
- `/opportunities/:id` - Opportunity detail
- `/retail` - Retail outlet directory
- `/distribution` - Distribution partner directory

### Auth Routes
- `/login` - Sign in
- `/register` - Create account
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form

### Dashboard Routes (Authenticated)
- `/dashboard` - Cooperative dashboard
- `/dashboard/cooperative/new` - Create cooperative
- `/dashboard/cooperative/:id/edit` - Edit cooperative
- `/dashboard/products` - Product management
- `/dashboard/products/new` - Add product
- `/dashboard/products/:id/edit` - Edit product

### Admin Routes (Admin Only)
- `/admin` - Admin dashboard
- `/admin/cooperatives` - Manage cooperatives
- `/admin/products` - Manage products
- `/admin/users` - Manage users
- `/admin/reviews` - Moderate reviews
- `/admin/events` - Manage events
- `/admin/buyers` - Manage buyers
- `/admin/opportunities` - Manage opportunities
- `/admin/retail-outlets` - Manage retail outlets
- `/admin/distribution-partners` - Manage distribution partners
- `/admin/aggregation-centers` - Manage aggregation centers
- `/admin/distribution-requests` - Manage distribution requests

---

## Deployment

### Build for Production
```bash
npm run build
```

The production build outputs to `dist/` directory.

### Vercel Deployment
A `vercel.json` is included for Vercel deployment with SPA routing support.

### Database Migrations
All migrations are in `supabase/migrations/`. Apply them in order:
1. `001_initial_schema.sql`
2. `002_storage_setup.sql`
3. `003_phase2_engagement_tables.sql`
4. `004_stabilization_fixes.sql.sql`
5. `005_phase3_event_platform.sql`
6. `006_phase4_market_linkages.sql`
7. `007_phase5_ncde_distribution.sql`

**Note:** If using Supabase MCP tools, use `mcp__supabase__apply_migration` for DDL operations.

---

## Known Issues & Limitations

1. **Git Push Authentication:** The provided GitHub token lacks write permissions. Manual push required:
   ```bash
   git push -u origin main
   ```

2. **Supabase CLI:** Not supported in the current environment. Use Supabase MCP tools instead.

3. **Dev Server:** Managed by the harness. Run `npm run build` to verify builds.

---

## Future Enhancements (Not Implemented)

Per the original requirements, the following were explicitly excluded:
- Push notifications
- Real-time messaging
- Payment processing
- Order management
- Delivery tracking
- Fleet management
- ERP integrations
- AI matching
- Mobile applications

---

## Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Authentication Issues
- Verify Supabase URL and anon key in `.env`
- Check RLS policies are correctly applied
- Ensure user has correct role assigned

### Missing Data
- Check RLS policies allow access
- Verify user is authenticated for protected routes
- Check `deleted_at` column (soft deletes used throughout)

---

## Contact & Resources

- **Supabase Dashboard:** https://supabase.com/dashboard
- **GitHub Repository:** https://github.com/agrihqafrica-max/ncdep
- **Project Owner:** AgriHQ (agrihq.africa@gmail.com)

---

## Git Push Instructions

If automatic push failed, execute manually:

```bash
# Navigate to project directory
cd /path/to/ncdep

# Ensure you have write access to the repository
# Generate a new GitHub Personal Access Token with repo scope
# Then push:
git push -u origin main
```

---

*Last Updated: 2025-06-25*
*Build Status: VERIFIED (npm run build successful - 1696 modules, 12.48s)*
