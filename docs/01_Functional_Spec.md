# HustleHub MVP - Functional Specification

## Product Overview

HustleHub is a streamlined invoice management system designed for freelancers and small businesses. The MVP focuses on essential invoicing workflows with integrated task management and automated follow-up capabilities.

**Current Live Metrics:**
- ₹29,500 paid this month
- ₹11,800 overdue amount  
- 2 tasks due in next 7 days

## Core User Flows

### 1. Dashboard Overview

<!--SHOT:DASHBOARD-->

**Purpose:** Central hub showing business health and quick actions

**Elements:**
- KPI cards: Monthly paid, overdue amounts, upcoming tasks
- Quick actions: Create invoice, add task, add client
- Recent activity feeds
- Navigation to all sections

**User Journey:**
1. User lands on dashboard after app load
2. Views current business metrics at a glance
3. Accesses quick actions for common tasks
4. Navigates to detailed sections via sidebar

**Empty State:** 
- "Welcome to HustleHub" message
- Setup prompts for first client/invoice
- Getting started guide

### 2. Create & Send Invoice Flow

<!--SHOT:INVOICE_CREATION-->

**Step 1: Invoice Details**
1. Navigate to "Create Invoice" or click dashboard quick action
2. Select client from dropdown (required)
3. Select project from client's projects (optional but recommended)
4. System auto-generates invoice number (HH-YYYY-NNNN format)
5. Set issue date (defaults to today) and due date

**Step 2: Add Items**
1. Add invoice line items:
   - Title/description
   - Quantity (default: 1)  
   - Rate per unit
   - Amount auto-calculated (qty × rate)
2. Multiple items supported
3. Real-time subtotal calculation
4. GST automatically calculated at 18% (configurable in settings)

**Step 3: Preview & Actions**
1. Preview invoice with professional formatting
2. UPI QR code generated automatically
3. Choose action:
   - **Save Draft:** Saves to database with status='draft'
   - **Save & Send:** Saves with status='sent' + creates 3 reminders

<!--SHOT:INVOICE_PREVIEW-->

**On Send (Automatic Actions):**
- Invoice status → 'sent'
- Creates 3 reminders scheduled at +3, +7, +14 days
- Generates UPI QR code for payment
- Creates message log entry
- Updates dashboard KPIs

**Validation Rules:**
- Client must be selected
- At least one invoice item required
- Due date cannot be before issue date
- All amounts must be positive numbers

### 3. Mark Invoice Paid Flow

<!--SHOT:MARK_PAID-->

**Trigger:** From invoices list or invoice detail view

**Steps:**
1. Click "Mark as Paid" on sent/overdue invoice
2. Modal opens with payment details form:
   - Paid date (defaults to today)
   - UTR reference number (for bank verification)
   - Confirmation text
3. Click "Mark as Paid" to confirm
4. System updates:
   - Invoice status → 'paid'
   - Sets paid_date and utr_reference
   - Updates KPIs immediately
   - Shows success celebration animation

**Business Rules:**
- Only sent/overdue invoices can be marked paid
- UTR reference recommended but not required
- Paid date cannot be before invoice issue date
- KPIs update in real-time across all views

### 4. Follow-ups Management

<!--SHOT:FOLLOWUPS-->

**Purpose:** Manage pending reminders for sent invoices

**View Content:**
- List of invoices with pending reminders
- Reminder schedule (3, 7, 14 days after issue date)
- Client contact information
- Quick "Send Now" actions

**Send Reminder Flow:**
1. Navigate to Follow-ups page
2. View invoices with status 'sent' or 'overdue'
3. Each invoice shows pending reminders with scheduled dates
4. Click "Send Now" on specific reminder
5. System actions:
   - Reminder status → 'sent'
   - Creates message log entry
   - Shows toast confirmation
   - Updates reminder list

**Reminder States:**
- **Pending:** Scheduled but not sent
- **Sent:** Delivered to client
- **Failed:** Delivery failed (rare)

### 5. Task Management

<!--SHOT:TASKS-->

**Add Task Flow:**
1. Navigate to Tasks page or use dashboard quick action
2. Fill task form:
   - Title (required)
   - Description (optional)
   - Project assignment (recommended)
   - Due date (optional)
   - Billable toggle
   - Hourly rate (if billable)
3. Save task
4. Task appears in list with status 'open'

**Task Status Flow:**
- **Open:** Newly created, ready to work
- **In Progress:** Currently being worked on
- **Done:** Completed
- **Cancelled:** No longer needed

**Billable Task to Invoice:**
1. Complete billable task (mark as 'done')
2. System prompts: "Create invoice for this task?"
3. If yes → Opens create invoice with:
   - Task client pre-selected
   - Task project pre-selected  
   - Task title as first invoice item
   - Task rate and estimated hours as amount
   - Task linked to invoice (linked_invoice_id)

**Task Views:**
- All tasks list with filters
- Upcoming tasks (due in next 7 days)
- Completed tasks
- Billable vs non-billable categorization

### 6. Client & Project Management

<!--SHOT:CLIENT_MANAGEMENT-->

**Add Client Flow:**
1. Navigate to Clients page or dashboard quick action
2. Fill client form:
   - Name (required)
   - WhatsApp number (for reminders)
   - Email address  
   - Business address
   - GSTIN (for tax compliance)
   - UPI VPA (preferred payment method)
3. Save client
4. Client available for invoice/project assignment

**Add Project Flow:**
1. From client detail view or projects page
2. Fill project form:
   - Name (required)
   - Client assignment
   - Billable toggle (affects default task billing)
3. Save project
4. Project available for task/invoice assignment

**Client Data Usage:**
- Invoice creation: Client selection + project filtering
- Payment preference: Client UPI VPA overrides settings UPI
- Contact info: Used for follow-up reminders
- Tax compliance: GSTIN appears on invoices if provided

## User Roles & Permissions

**Current State (MVP):** Single user mode - no authentication required

**Permissions:** Full access to all features and data

**Data Isolation:** None - all users see all data (suitable for single freelancer/small business)

**Future (Phase 2):** Multi-user with role-based access:
- Owner: Full system access
- Collaborator: Limited to assigned projects
- Client: Read-only access to their invoices

## Error States & Handling

### Network Errors
- **Connection Lost:** "Unable to connect. Check your internet connection."
- **Server Error:** "Service temporarily unavailable. Please try again."
- **Timeout:** "Request timed out. Please retry."

**User Actions:** Retry button, automatic retry for critical operations

### Validation Errors
- **Form Validation:** Real-time field validation with clear error messages
- **Business Logic:** "Cannot mark draft invoice as paid"
- **Data Constraints:** "Invoice number already exists"

### Empty States
- **No Clients:** "Add your first client to get started" + prominent CTA
- **No Invoices:** "Create your first invoice" + quick action
- **No Tasks:** "Add tasks to track your work" + add button
- **No Reminders:** "All caught up! No pending follow-ups"

### Data Loading States
- **Skeleton UI:** Loading placeholders for all data tables
- **Progressive Loading:** KPIs load first, then detailed data
- **Optimistic Updates:** UI updates immediately, syncs in background

## Micro-interactions & Celebrations

### Success Animations
- **Invoice Created:** Confetti explosion with success message
- **Payment Received:** Money animation with updated KPIs
- **Task Completed:** Checkmark with satisfying completion sound
- **Client Added:** Welcome animation with relationship building theme

### Loading Interactions
- **Button States:** Loading spinners during save operations  
- **Progress Indicators:** Multi-step forms show completion progress
- **Skeleton Screens:** Content-aware loading placeholders

### Feedback Systems
- **Toast Notifications:** Non-intrusive success/error messages
- **Badge Counts:** Notification indicators for pending items
- **Status Indicators:** Color-coded status badges throughout UI

### Hover & Focus States
- **Interactive Elements:** Clear hover feedback on all clickable items
- **Form Fields:** Focus rings and validation state colors
- **Navigation:** Active state highlighting for current page

## Accessibility Features

### Keyboard Navigation
- Full keyboard accessibility for all interactive elements
- Logical tab order through forms and interfaces
- Escape key to close modals and dropdowns

### Screen Reader Support
- Semantic HTML structure with proper headings
- ARIA labels for complex interactive elements
- Alt text for all functional images

### Visual Accessibility
- High contrast color scheme with semantic design tokens
- Consistent typography scaling
- Clear visual hierarchy with proper heading structure

## Performance Considerations

### Data Loading
- React Query caching reduces unnecessary API calls
- Optimistic updates for immediate user feedback
- Progressive data loading for large datasets

### Mobile Responsiveness
- Responsive design adapts to all screen sizes
- Touch-friendly interface elements
- Optimized for mobile invoice viewing and creation

## Security & Privacy

### Data Protection (Current MVP)
- All data stored in Supabase with encryption at rest
- HTTPS for all API communications
- No authentication required (single-user mode)

### Future Security (Phase 2)
- Row Level Security (RLS) for multi-user data isolation
- Email/password authentication via Supabase Auth
- Session management with automatic logout
- Audit logging for sensitive operations

## Future Enhancements (Phase 2)

### Advanced Features
- PDF invoice generation and email delivery
- Recurring invoice templates
- Advanced reporting and analytics
- Payment gateway integration (Razorpay, Stripe)
- Multi-currency support

### User Experience
- Bulk operations (mass invoice updates)
- Advanced filtering and search
- Customizable dashboard widgets
- Mobile app development

### Business Features
- Team collaboration tools
- Client portal for invoice access
- Advanced tax compliance features
- Integration with accounting software
