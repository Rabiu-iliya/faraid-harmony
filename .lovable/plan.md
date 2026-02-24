

# GadoPro — Islamic Inheritance (Faraid) Distribution System

A complete web application for calculating and distributing Islamic inheritance with an Islamic-themed design (green/gold palette, geometric patterns), full user authentication, and an AI-powered assistant called GadoBot.

---

## 1. Authentication & User Management
- **Sign up / Login** with email and password using Supabase Auth
- **Admin and regular user roles** stored in a separate `user_roles` table
- **Profile management** — name, contact info, relationship type
- Admin dashboard to manage heirs, assets, and inheritance rules
- Password reset flow

## 2. Islamic-Themed UI Design
- Green and gold color palette with geometric/arabesque pattern accents
- Clean, professional dashboard layout with sidebar navigation
- Sections: Dashboard, Assets, Heirs, Calculate, Reports, GadoBot, Settings
- Responsive design for desktop and mobile
- RTL-ready layout structure for Arabic/Urdu users

## 3. Global Settings (Two Separate Fieldsets)
- **Language Settings fieldset**: Dropdown with 20+ languages (English and Hausa at top, followed by Arabic, French, Spanish, Portuguese, Turkish, Urdu, Malay, Indonesian, Swahili, Bengali, Hindi, Chinese, Russian, German, Japanese, Korean, Italian, Dutch)
- **Currency Settings fieldset**: Dropdown for currencies (NGN, USD, EUR, GBP, SAR, AED, MYR, etc.)
- Language and currency stored as independent user preferences
- Language affects all UI text; currency affects all monetary values
- Currency must be selected before any calculation can run

## 4. Asset Management
- Add, edit, and delete assets with categories: Cash, Real Estate, Jewelry, Valuables, Other
- Assign monetary value to each asset in the selected currency
- Real-time total estate value calculation
- Asset list with filtering and sorting

## 5. Heir Management
- Define heirs with relationship types: Son, Daughter, Father, Mother, Husband, Wife, Full Brother, Full Sister, Paternal Brother, Paternal Sister, Maternal Brother, Maternal Sister, Grandfather, Grandmother, Grandson, Granddaughter
- Each heir gets a name, relationship, and contact info
- Visual indicator when a heir is blocked by another

## 6. Faraid Calculation Engine
- **Fixed shares (Fard)**: Automatically assign Quranic shares (1/2, 1/4, 1/8, 1/3, 2/3, 1/6) based on heir combination
- **Blocking rules (Ḥajb)**: Automatically exclude heirs based on Islamic rules:
  - Children block siblings from inheritance
  - Son blocks grandson
  - Father blocks siblings and grandfather
  - Full siblings block paternal siblings
  - Maternal siblings blocked when father exists
- **Residuary (ʿAsabah)**: Distribute remainder to eligible residuary heirs
- **ʿAwl**: Proportionally reduce shares when total exceeds the estate
- **Radd**: Redistribute surplus back to eligible heirs when total is less than estate
- Blocked heirs clearly marked with zero share and blocking reason

## 7. Calculation Flow
Step-by-step wizard:
1. Confirm language & currency
2. Review/input assets → total estate calculated
3. Define/review heirs
4. System auto-applies blocking rules
5. System assigns fixed shares and residuary
6. ʿAwl or Radd applied if needed
7. Final distribution computed in selected currency
8. Results saved to database

## 8. Reports & Visualization
- **Distribution table** showing each heir's share amount and percentage
- **Pie chart** of share distribution
- **Bar chart** comparing heir shares
- Blocked heirs section with reasons
- ʿAwl / Radd indicator when applied
- **Export to PDF** — formatted report with branding
- **Export to Excel** — data table export
- Total estate summary at top of every report

## 9. GadoBot — AI Assistant
- Chat interface powered by Lovable AI (via Supabase Edge Function)
- Context-aware: knows the current calculation, heirs, and results
- Answers questions like:
  - "What is each heir's share?"
  - "Why was this heir blocked?"
  - "What happens if I add a new daughter?"
  - "Explain ʿAwl and Radd simply"
- Islamic-themed chat bubble design
- Accessible from any page via floating button

## 10. Database Structure (Supabase)
- **profiles** — user profile data
- **user_roles** — admin/user roles (separate table)
- **user_preferences** — language and currency settings (separate columns)
- **assets** — estate items with category, value, currency
- **heirs** — heir definitions with relationship type
- **calculations** — saved calculation results
- **calculation_heirs** — per-heir share breakdown per calculation
- Row-Level Security on all tables

## 11. Multilingual Support
- Translation system for all UI text
- JSON-based translation files
- Language switcher in settings and optionally in the header
- Default to English, with Hausa prominently available

