# HustleHub — UPI Business Management Platform

A React-based business management platform for Indian freelancers and small businesses, featuring invoice creation, UPI payment integration, and automated follow-up systems.

## 🚀 Live Demo

**URL**: https://lovable.dev/projects/05aade8b-e990-49d1-b9be-8cd413ddd42e

## ✨ Key Features

- **Invoice Management**: Create, edit, and track invoices with PDF generation
- **UPI Payment Integration**: Generate UPI deeplinks and QR codes for instant payments  
- **Client Management**: Complete client database with contact information
- **Follow-up Automation**: WhatsApp share (manual); Email reminders (planned)
- **Task Tracking**: Billable task management with invoice linking
- **Dashboard Analytics**: Real-time metrics and payment tracking
- **QA Testing Suite**: Built-in testing framework for reliability
- **Mobile-First Design**: Responsive UI optimized for Indian users

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Payments**: UPI protocol integration
- **State**: Zustand + TanStack Query
- **PDF**: jsPDF + html2canvas
- **QR Codes**: qrcode.react library

## ⚡ Quick Start

```bash
# Clone repository
git clone <YOUR_GIT_URL>
cd hustlehub

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your Supabase credentials

# Start development server
npm run dev
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── ui/             # shadcn/ui component library
│   ├── layout/         # Layout components (header, sidebar)
│   └── celebrations/   # Success animations
├── pages/              # Route components
│   ├── auth/          # Sign in/up pages
│   └── invoices/      # Invoice management pages
├── lib/               # Utilities and helpers
├── services/          # Business logic (payments, PDF)
├── qa/                # Testing framework
├── data/              # Supabase data layer
└── hooks/             # Custom React hooks
```

## 🔧 Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📖 Documentation

- [**Status & Roadmap**](docs/STATUS.md) — Current feature status and development plan
- [**Architecture**](docs/ARCHITECTURE.md) — System design and component structure  
- [**Data Model**](docs/DATA_MODEL.md) — Database schema and relationships
- [**User Flows**](docs/FLOWS.md) — Key user journeys and workflows
- [**Setup Guide**](docs/SETUP.md) — Detailed development setup instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🚀 Deployment

Deploy instantly via Lovable:
1. Open [Lovable Project](https://lovable.dev/projects/05aade8b-e990-49d1-b9be-8cd413ddd42e)
2. Click **Share → Publish**
3. Optional: Connect custom domain in Project → Settings → Domains

## 📄 License

This project is built with [Lovable](https://lovable.dev) — AI-powered React development platform.

## 🔒 Security (Current Phase)

- **Single-user architecture**: MVP designed for individual users
- **Data minimization**: Sensitive data excluded from list endpoints
- **Supabase Auth**: Built-in security with email verification
- **Phase 2 planned**: Multi-user with Row Level Security (RLS)

See `supabase/policies/phase2_rls_draft.sql` for planned security enhancements.
