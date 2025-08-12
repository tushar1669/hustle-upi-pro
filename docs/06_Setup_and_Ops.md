# HustleHub MVP - Setup & Operations

## Development Setup

### Prerequisites

**System Requirements:**
- **Node.js:** 18.0.0 or higher
- **Package Manager:** npm (recommended) or bun
- **Browser:** Modern browser with ES2020+ support
- **Internet Connection:** Required for Supabase integration

**Development Tools (Recommended):**
- **VS Code** with TypeScript and React extensions
- **Git** for version control
- **Browser DevTools** for debugging

### Local Installation

#### 1. Clone Repository

```bash
# Clone the project repository
git clone <repository-url>
cd hustlehub

# Verify Node.js version
node --version  # Should be 18.0.0+
```

#### 2. Install Dependencies

```bash
# Using npm (recommended)
npm install

# Or using bun (faster alternative)
bun install
```

**Key Dependencies Installed:**
- React 18.3.1 + TypeScript
- Vite (build tool)
- Supabase client 2.55.0
- React Query 5.83.0
- Tailwind CSS + shadcn/ui
- 70+ other production dependencies

#### 3. Configure Environment

Currently, no environment file is required as configuration is hardcoded for MVP simplicity.

**Supabase Configuration (Automatic):**
```typescript
// src/integrations/supabase/client.ts
const SUPABASE_URL = "https://jldeysxlrcvggssvighb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

#### 4. Start Development Server

```bash
# Start Vite development server
npm run dev

# Or with bun
bun dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

#### 5. Verify Installation

1. **Open Browser:** Navigate to `http://localhost:5173`
2. **Check Dashboard:** Should load without errors
3. **Test Navigation:** Click through sidebar menu items
4. **Verify Supabase:** Dashboard should show empty state prompts

### Supabase Project Setup

#### 1. Supabase Project Access

**Current Project:** Already configured with demo database
**URL:** `https://jldeysxlrcvggssvighb.supabase.co`
**Status:** Production-ready with full schema

**Database Schema:** 8 tables + 1 view automatically available
- settings, clients, projects, invoices, invoice_items
- tasks, reminders, message_log
- v_dashboard_metrics (view)

#### 2. Database Verification

```bash
# Test database connection via QA system
# Navigate to http://localhost:5173/qa
# Click "Run All Tests" - should show DB_CONN test passing
```

#### 3. Row Level Security (RLS) Status

**Current State:** All policies allow public access
```sql
-- Example policy (applied to all tables)
CREATE POLICY "Allow all access in MVP" 
ON invoices FOR ALL 
USING (true);
```

**Future Migration:** Ready for user-based RLS when authentication is added

### Demo Data Initialization

#### 1. Access QA System

```bash
# Navigate to QA page
http://localhost:5173/qa
```

#### 2. Populate Demo Data

1. **Click "Populate Demo Data"** button
2. **Wait for completion** (~10 seconds)
3. **Verify creation** of:
   - 3 clients (Acme Studios, Bright Ideas, Creative Minds)
   - 3 projects (Website Revamp, Mobile App, Brand Refresh)  
   - 3 invoices (HH-2025-1001, 1002, 1003)
   - 6 invoice items (various services)
   - 3 tasks (mix of billable/non-billable)
   - 6 reminders (automated follow-ups)

#### 3. Validate Setup

1. **Check Dashboard:** Should show live KPIs
   - ₹29,500 paid this month
   - ₹11,800 overdue amount
   - 2 tasks due in next 7 days

2. **Run QA Tests:** Click "Run All Tests"
   - Expected: 14/14 tests passing
   - Validates complete system functionality

3. **Test Core Flows:**
   - Create new invoice
   - Add client
   - Mark invoice as paid
   - Add and complete task

## Development Workflow

### Code Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   ├── auth/            # Authentication (Phase 2)
│   ├── celebrations/    # Success animations
│   └── layout/          # App layout components
├── pages/               # Route-based page components
│   ├── auth/            # Login/signup pages (Phase 2)
│   ├── invoices/        # Invoice management
│   └── *.tsx            # Main app pages
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── data/                # Supabase data access (collections)
├── qa/                  # Quality assurance system
├── store/               # Zustand state management
├── types.ts             # TypeScript definitions
└── integrations/        # External service clients
```

### Development Commands

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Hot Reload and Development Features

**Vite Hot Module Replacement (HMR):**
- Instant updates without page refresh
- State preservation during development
- CSS changes apply immediately
- TypeScript errors shown in browser

**Development Tools:**
- React DevTools extension recommended
- Browser console shows helpful error messages
- Source maps enabled for debugging

### Testing During Development

**QA Integration:**
```bash
# Always run tests after changes
1. Navigate to /qa
2. Click "Run All Tests" 
3. Verify 14/14 passing
4. Fix any failures before committing
```

**Manual Testing Checklist:**
- [ ] Dashboard loads with correct KPIs
- [ ] Invoice creation flow works end-to-end
- [ ] Task management functional
- [ ] Client CRUD operations working
- [ ] Follow-ups page shows pending reminders
- [ ] Mark paid updates KPIs immediately

## Production Deployment

### Lovable Platform Deployment

**Automatic Deployment:**
- Connected to Lovable platform
- Automatic builds on code changes
- CDN distribution included
- HTTPS enabled by default

**Build Process:**
1. **TypeScript Compilation:** All .tsx files compiled to JavaScript
2. **Asset Optimization:** CSS minimized, images optimized
3. **Code Splitting:** Automatic chunking for optimal loading
4. **Static Asset Generation:** All files prepared for CDN

### Environment Configuration

**Production Settings (Inferred):**
```bash
# No environment variables currently required
# All configuration hardcoded for MVP

# Future production environment:
# VITE_SUPABASE_URL=production-url
# VITE_SUPABASE_ANON_KEY=production-key
# VITE_ENVIRONMENT=production
```

**Supabase Production:**
- Same database used for dev and production (MVP)
- RLS policies allow all access (no auth)
- Automatic scaling via Supabase

### Pre-Deployment Checklist

#### 1. Code Quality
- [ ] All TypeScript errors resolved
- [ ] No console errors in browser
- [ ] Proper error handling implemented
- [ ] Loading states working correctly

#### 2. Database Validation
- [ ] Supabase connection stable
- [ ] All tables and views accessible
- [ ] RLS policies configured (currently permissive)
- [ ] Demo data available for testing

#### 3. QA Validation
- [ ] All 14 Classic QA tests passing
- [ ] All 7 Smoke tests passing  
- [ ] All 8 Feature tests passing
- [ ] No test failures or regressions

#### 4. Performance Check
- [ ] Page load times acceptable (<3 seconds)
- [ ] Large datasets render smoothly
- [ ] Mobile responsiveness verified
- [ ] Network requests optimized

#### 5. Feature Validation
- [ ] Invoice creation → send → mark paid flow
- [ ] Task management → billable conversion
- [ ] Client/project management
- [ ] Follow-up reminders scheduling
- [ ] Dashboard KPIs updating correctly

### Post-Deployment Verification

#### 1. Smoke Test in Production
```bash
# Run basic validation
1. Load production URL
2. Check dashboard metrics
3. Create test invoice
4. Verify database persistence
5. Clean up test data
```

#### 2. Performance Monitoring
- **Loading Speed:** All pages < 3 seconds
- **API Response Time:** Database queries < 500ms
- **Error Rate:** Zero JavaScript errors
- **Cache Hit Rate:** React Query working properly

#### 3. User Experience Validation
- **Mobile Responsiveness:** Test on various devices
- **Browser Compatibility:** Chrome, Firefox, Safari, Edge
- **Accessibility:** Keyboard navigation working
- **Error Handling:** Graceful failure modes

## Troubleshooting Guide

### Common Development Issues

#### 1. Installation Problems

**Node Version Mismatch:**
```bash
# Symptoms: npm install fails
# Solution: Update Node.js to 18+
node --version
# If older: Download from nodejs.org
```

**Dependency Conflicts:**
```bash
# Symptoms: Build errors, strange behaviors
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Port Already in Use:**
```bash
# Symptoms: "Port 5173 is already in use"
# Solution: Kill process or use different port
npx kill-port 5173
# Or: npm run dev -- --port 3000
```

#### 2. Database Connection Issues

**Supabase Connection Failed:**
```bash
# Symptoms: "Failed to connect to Supabase"
# Check: Browser network tab for failed requests
# Solution: Verify URL and API key in client.ts
```

**RLS Policy Errors:**
```bash
# Symptoms: "new row violates row-level security policy"
# Check: RLS policies should allow all in MVP
# Solution: Verify policies are permissive
```

**Demo Data Missing:**
```bash
# Symptoms: Empty dashboard, test failures
# Solution: Navigate to /qa and click "Populate Demo Data"
```

#### 3. React/TypeScript Issues

**Type Errors:**
```bash
# Symptoms: TypeScript compilation fails
# Check: Browser shows type errors
# Solution: Fix types or add type assertions
```

**Hook Dependency Warnings:**
```bash
# Symptoms: Console warnings about useEffect dependencies
# Solution: Add missing dependencies or use useCallback
```

**State Update Warnings:**
```bash
# Symptoms: "Can't perform React state update on unmounted component"
# Solution: Use cleanup functions in useEffect
```

#### 4. UI/Styling Issues

**Tailwind Styles Not Applied:**
```bash
# Symptoms: Components look unstyled
# Check: Tailwind classes in browser DevTools
# Solution: Verify tailwind.config.ts and index.css
```

**shadcn/ui Component Issues:**
```bash
# Symptoms: Components don't render correctly
# Check: Component imports and dependencies
# Solution: Verify component installation and usage
```

**Responsive Design Problems:**
```bash
# Symptoms: Layout breaks on mobile
# Check: Browser responsive mode
# Solution: Update Tailwind responsive classes
```

#### 5. Cache and State Issues

**Stale Data in UI:**
```bash
# Symptoms: UI doesn't update after mutations
# Check: React Query DevTools
# Solution: Verify cache invalidation patterns
```

**localStorage Issues:**
```bash
# Symptoms: Settings not persisting
# Check: Browser Application tab
# Solution: Clear localStorage or fix storage logic
```

#### 6. QA Test Failures

**Tests Failing After Code Changes:**
```bash
# Symptoms: Previously passing tests now fail
# Solution: Review changes and run Fix Mode
```

**Demo Data Corruption:**
```bash
# Symptoms: Tests fail due to bad data
# Solution: Reset demo data via QA interface
```

### Performance Issues

#### 1. Slow Page Loading

**Large Bundle Size:**
```bash
# Check: npm run build output
# Solution: Use dynamic imports for large components
const QA = lazy(() => import('@/pages/QA'));
```

**Unnecessary Re-renders:**
```bash
# Check: React DevTools Profiler
# Solution: Use React.memo and useMemo
```

**Slow Database Queries:**
```bash
# Check: Browser Network tab
# Solution: Optimize queries or add indexes
```

#### 2. Memory Issues

**Memory Leaks:**
```bash
# Check: Browser Memory tab
# Solution: Clean up event listeners and subscriptions
```

**Large State Objects:**
```bash
# Check: React DevTools Components
# Solution: Normalize state structure
```

### Production Issues

#### 1. Deployment Failures

**Build Errors:**
```bash
# Check: Build logs in Lovable dashboard
# Solution: Fix TypeScript errors and missing dependencies
```

**Asset Loading Issues:**
```bash
# Symptoms: 404 errors for CSS/JS files
# Solution: Verify build output and CDN configuration
```

#### 2. Runtime Errors

**JavaScript Errors in Production:**
```bash
# Check: Browser console and error tracking
# Solution: Add proper error boundaries and logging
```

**API Failures:**
```bash
# Check: Network tab for failed requests
# Solution: Verify Supabase configuration and permissions
```

### Debug Mode and Logging

#### Enable Debug Logging

```javascript
// In browser console
localStorage.setItem('debug', 'true');
localStorage.setItem('qa:debug', 'true');

// Provides detailed logs for:
// - React Query operations
// - QA test execution
// - Supabase interactions
```

#### Browser DevTools Usage

**React Developer Tools:**
- Install React DevTools extension
- Inspect component state and props
- Profile performance issues

**Network Analysis:**
- Monitor Supabase API calls
- Check request/response times
- Identify failed requests

**Console Debugging:**
```javascript
// Add temporary logging
console.log('Debug: Invoice data:', invoiceData);
console.table(invoices); // Table format for arrays
```

### Getting Help

#### Community Resources
- **React Documentation:** https://react.dev
- **Supabase Docs:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com

#### Internal Resources
- **QA System:** Use /qa page for systematic testing
- **Code Comments:** Check inline documentation
- **Type Definitions:** Review types.ts for data structures

#### Escalation Process
1. **Check QA Tests:** Run full test suite to identify issues
2. **Review Console:** Look for JavaScript errors
3. **Check Network:** Verify API calls succeeding
4. **Isolate Issue:** Reproduce with minimal example
5. **Document Problem:** Include steps to reproduce

## Maintenance and Monitoring

### Regular Maintenance Tasks

#### Weekly Tasks
- [ ] Run full QA test suite
- [ ] Check for dependency updates
- [ ] Review error logs
- [ ] Validate database performance

#### Monthly Tasks  
- [ ] Comprehensive security review
- [ ] Performance optimization review
- [ ] Update dependencies (patch versions)
- [ ] Backup validation

#### Quarterly Tasks
- [ ] Major dependency updates
- [ ] Security audit
- [ ] Performance benchmarking
- [ ] Documentation updates

### Monitoring and Alerts

**Current Monitoring (Manual):**
- QA test results
- Browser console errors
- Supabase dashboard metrics

**Future Monitoring (Phase 2):**
- Automated uptime monitoring
- Error tracking (Sentry)
- Performance monitoring
- User analytics

### Backup and Recovery

**Supabase Automatic Backups:**
- Daily automated backups
- Point-in-time recovery available
- Cross-region replication

**Manual Backup Process:**
```bash
# Export QA test results
1. Navigate to /qa
2. Click "Export Combined Report"
3. Save JSON file with timestamp

# Export application state
# (Future: Automated backup scripts)
```

**Recovery Procedures:**
1. **Database Recovery:** Via Supabase dashboard
2. **Application Recovery:** Redeploy from git
3. **Demo Data Recovery:** Use QA "Populate Demo Data"
