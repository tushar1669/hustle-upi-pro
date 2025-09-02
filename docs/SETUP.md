# HustleHub — Development Setup Guide

**Platform**: Lovable + Supabase Stack  
**Target OS**: macOS, Windows, Linux  
**Prerequisites**: Node.js 18+, Git, Modern browser  
**Last Updated**: 2025-01-02

## 🚀 Quick Start (5 Minutes)

### 1. Clone & Install
```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd hustlehub

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment
Edit `.env` with your Supabase credentials:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start Development
```bash
# Start dev server with hot reload
npm run dev

# Open browser to http://localhost:5173
```

## 📋 Prerequisites

### System Requirements
- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v8.0.0 or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Development Tools (Recommended)
- **VS Code**: With TypeScript and Tailwind extensions
- **Postman/Insomnia**: For API testing
- **React DevTools**: Browser extension for debugging
- **Database Client**: For Supabase/PostgreSQL inspection

## 🔧 Environment Configuration

### Supabase Setup

#### 1. Create Supabase Project
1. Visit [supabase.com](https://supabase.com) and create account
2. Create new project with PostgreSQL database
3. Note your project URL and anon key from Settings → API

#### 2. Database Schema
The database schema is already configured. If you need to reset:
```bash
# Run migrations (if available)
npx supabase db reset

# Or manually run SQL scripts from supabase/migrations/
```

#### 3. Authentication Setup
```sql
-- Enable email auth (should be default)
-- Supabase Dashboard → Authentication → Settings
-- Enable "Enable email confirmations"
-- Set Site URL to: http://localhost:5173
```

### Environment Variables (.env)
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Development Settings
VITE_DEBUG_MODE=true
VITE_SHOW_QA_MENU=true
```

**⚠️ Security Note**: Never commit real API keys to version control. The `.env` file is gitignored.

## 🗄 Database Setup

### Schema Overview
The database includes these main tables:
- `settings` - Business configuration
- `clients` - Customer information
- `projects` - Work organization
- `invoices` - Billing documents
- `invoice_items` - Line items
- `tasks` - Work tracking
- `reminders` - Follow-up automation
- `message_log` - Communication history
- `savings_goals` - Financial targets

### Sample Data (Optional)
```bash
# Access QA page in development
# Navigate to http://localhost:5173/qa
# Click "Populate Demo Data" to add sample records
```

## 🛠 Development Workflow

### Available Scripts
```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Development Server Features
- **Hot Module Replacement (HMR)**: Instant updates without page refresh
- **TypeScript Checking**: Real-time type validation
- **Auto-Restart**: Server restarts on configuration changes
- **Network Access**: Available on local network for mobile testing

### File Structure for Development
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── auth/           # Authentication components
│   ├── layout/         # App layout components
│   └── celebrations/   # Success feedback system
├── pages/              # Route-level components
│   ├── auth/          # Authentication pages
│   └── invoices/      # Invoice management
├── lib/               # Utilities and helpers
│   ├── utils.ts       # General utilities
│   ├── supabase.ts    # Database client
│   └── pdfGenerator.ts # PDF creation
├── services/          # Business logic
│   └── payments.ts    # UPI and payment utilities
├── hooks/             # Custom React hooks
├── data/              # Database operations
│   └── collections.ts # Supabase queries
├── qa/                # Testing framework
└── types.ts           # TypeScript definitions
```

## 🧪 Testing Setup

### Built-in QA System
HustleHub includes a comprehensive QA framework:

1. **Access QA Dashboard**
   ```bash
   # Navigate to QA page
   http://localhost:5173/qa
   ```

2. **Run Feature Tests**
   - Client management validation
   - Invoice creation and PDF generation
   - Payment flow testing
   - Follow-up system validation
   - Settings configuration testing

3. **Demo Data Management**
   - Optional demo data population
   - Test data cleanup utilities
   - Realistic sample scenarios

### Manual Testing Checklist
- [ ] User signup and email verification
- [ ] Onboarding wizard completion
- [ ] Client creation and management
- [ ] Invoice creation with PDF generation
- [ ] UPI QR code generation
- [ ] WhatsApp reminder sending
- [ ] Payment status updates
- [ ] Dashboard metrics accuracy

## 📱 Mobile Development Testing

### Testing on Mobile Devices
```bash
# Find your local IP address
# macOS/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows:
ipconfig | findstr "IPv4 Address"

# Access on mobile device
http://YOUR_LOCAL_IP:5173
```

### Mobile-Specific Testing
- **Touch Interactions**: Tap targets, swipe gestures
- **Viewport Sizes**: iPhone, Android, tablet breakpoints
- **Performance**: Network throttling, slow 3G simulation
- **UPI Integration**: Test QR codes with real UPI apps

## 🔗 Integration Testing

### UPI Payment Testing
```typescript
// Test UPI intent generation
import { buildUpiIntent } from '@/services/payments';

const testIntent = buildUpiIntent({
  pa: 'test@upi',
  pn: 'Test Business',
  am: 1000,
  tn: 'Test Invoice'
});

console.log(testIntent);
// Expected: upi://pay?pa=test@upi&pn=Test%20Business&am=1000&tn=Test%20Invoice
```

### WhatsApp Link Testing
```typescript
// Test WhatsApp URL generation
import { buildWhatsAppUrl } from '@/services/payments';

const testUrl = buildWhatsAppUrl({
  phone: '+919876543210',
  text: 'Payment reminder for Invoice #HH001'
});

console.log(testUrl);
// Expected: https://wa.me/919876543210?text=Payment%20reminder...
```

### PDF Generation Testing
```bash
# Test PDF generation in browser
# Create an invoice and click "Download PDF"
# Verify PDF contains proper formatting and data
```

## 🚀 Deployment Setup

### Lovable Platform Deployment
1. **Automatic Deployment**
   - Code changes automatically deploy via Lovable
   - Build logs available in Lovable dashboard
   - Instant preview URLs for testing

2. **Custom Domain Setup**
   ```bash
   # In Lovable project settings
   Project → Settings → Domains → Connect Domain
   # Follow DNS configuration instructions
   ```

### Environment-Specific Configuration
```bash
# Production environment variables
# Set in Lovable project settings → Environment
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
```

### Production Checklist
- [ ] Supabase project configured for production
- [ ] Environment variables set correctly
- [ ] Authentication redirect URLs updated
- [ ] CORS settings configured
- [ ] SSL certificate active
- [ ] Error monitoring enabled

## 🔍 Debugging & Troubleshooting

### Common Issues & Solutions

#### Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

#### Supabase Connection Issues
```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Test connection in browser console
import { supabase } from './src/integrations/supabase/client';
const { data, error } = await supabase.from('settings').select('*');
console.log({ data, error });
```

#### Authentication Problems
1. **Email not verified**: Check spam folder, resend verification
2. **Redirect issues**: Verify Site URL in Supabase auth settings
3. **Token errors**: Clear localStorage and re-authenticate

#### Performance Issues
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Check for memory leaks
# Use Chrome DevTools → Memory tab
```

### Browser Developer Tools
- **Console**: Error messages and debugging output
- **Network**: API requests and response times
- **Application**: Local storage and service worker status
- **Performance**: Page load and runtime performance
- **React DevTools**: Component state and props inspection

### Logging & Monitoring
```typescript
// Enable detailed logging in development
localStorage.setItem('debug', 'hustlehub:*');

// View Supabase logs
// Supabase Dashboard → Logs → API/Auth/Realtime
```

## 📚 Additional Resources

### Documentation Links
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

### Community & Support
- [Lovable Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)
- [Supabase Discord](https://discord.supabase.com/)
- [React Community](https://react.dev/community)

### Development Best Practices
- **Code Style**: Follow existing patterns and ESLint rules
- **Component Design**: Keep components small and focused
- **State Management**: Use TanStack Query for server state
- **Error Handling**: Provide user-friendly error messages
- **Performance**: Optimize images and lazy load components
- **Accessibility**: Ensure keyboard navigation and screen reader support

## 🔐 Security Considerations

### Development Security
- **Environment Variables**: Never commit secrets to version control
- **API Keys**: Use development keys for local testing
- **HTTPS**: Use HTTPS in production, HTTP OK for development
- **CORS**: Configure properly for your domains

### Production Security
- **RLS Policies**: Implement Row Level Security for multi-user
- **Input Validation**: Validate all user inputs
- **SQL Injection**: Use parameterized queries
- **XSS Protection**: Sanitize user content
- **Data Encryption**: Encrypt sensitive data at rest

This setup guide should get you up and running with HustleHub development. For specific issues, check the troubleshooting section or reach out to the development team.