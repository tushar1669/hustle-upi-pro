# HustleHub — User Flows & Workflows

**Purpose**: Document key user journeys with visual flowcharts and screen references  
**Target Users**: Indian freelancers and small business owners  
**Last Updated**: 2025-01-02

## 🚀 First-Time User Experience (FTUX)

### Onboarding Flow
```mermaid
flowchart TD
    A[User visits site] --> B{Authenticated?}
    B -->|No| C[Show Sign Up page]
    B -->|Yes| D{Onboarding complete?}
    
    C --> E[Email signup form]
    E --> F[Email verification sent]
    F --> G[User clicks email link]
    G --> H[Account confirmed]
    
    H --> I[Onboarding Wizard]
    D -->|No| I
    
    I --> J[Step 1: Business Info]
    J --> K[Step 2: UPI Setup]
    K --> L[Step 3: First Client]
    L --> M[Step 4: Payment Method]
    M --> N[Setup Complete]
    
    N --> O[Dashboard with celebaration]
    D -->|Yes| O
    
    O --> P[Optional: Populate Demo Data]
```

**Key Screens**:
- `/auth/signup` - `SignUp.tsx`
- `/auth/signin` - `SignIn.tsx`  
- `/` - `Index.tsx` with `OnboardingWizard.tsx`

**Business Logic**:
- Email verification required before app access
- Onboarding wizard tracks completion state
- Demo data population is optional
- Celebration system rewards setup completion

## 💰 Core Invoice-to-Payment Workflow

### Invoice Creation & Payment Collection
```mermaid
flowchart TD
    A[User clicks 'New Invoice'] --> B[Invoice Creation Form]
    B --> C[Select Client]
    C --> D[Add Line Items]
    D --> E[Review Totals & GST]
    E --> F[Generate Invoice]
    
    F --> G[Invoice Preview Modal]
    G --> H[Generate PDF]
    G --> I[Generate UPI QR Code]
    G --> J[Copy UPI Payment Link]
    
    J --> K[Share via WhatsApp]
    K --> L[Client Opens wa.me Link]
    L --> M[Pre-filled Payment Message]
    
    M --> N[Client Opens UPI App]
    N --> O[Payment Processing]
    O --> P{Payment Successful?}
    
    P -->|Yes| Q[Client Notifies Business]
    P -->|No| R[Payment Failed - Retry]
    
    Q --> S[Business Marks Invoice Paid]
    S --> T[Success Celebration]
    T --> U[Update Dashboard Metrics]
    
    R --> N
```

**Key Screens**:
- `/invoices/new` - `CreateInvoice.tsx`
- `/invoices` - `InvoicesList.tsx`
- Modal: `InvoicePreviewModal.tsx`

**Integration Points**:
- **UPI Protocol**: `services/payments.ts` - `buildUpiIntent()`
- **PDF Generation**: `lib/pdfGenerator.ts`
- **WhatsApp**: `buildWhatsAppUrl()` for wa.me links
- **Celebrations**: `CelebrationProvider.tsx`

## 🔔 Automated Follow-up System

### Payment Reminder Cadence
```mermaid
flowchart TD
    A[Invoice Status: 'Sent'] --> B[System schedules reminders]
    
    B --> C[T-3 Days: Gentle Reminder]
    B --> D[Due Date: Professional Reminder]  
    B --> E[T+7 Days: Firm Reminder]
    
    C --> F{Reminder Time Reached?}
    D --> F
    E --> F
    
    F -->|Yes| G[User reviews reminder]
    F -->|No| H[Wait for scheduled time]
    
    G --> I{User confirms send?}
    I -->|Yes| J[Generate reminder message]
    I -->|No| K[Mark reminder as skipped]
    
    J --> L{Channel selected?}
    L -->|WhatsApp| M[Open wa.me with message]
    L -->|Email| N[Send email - Planned]
    
    M --> O[User sends message manually]
    O --> P[System logs message sent]
    
    N --> P
    K --> Q[Log skipped reminder]
    P --> R[Update reminder status]
    Q --> R
    
    R --> S{Invoice still unpaid?}
    S -->|Yes| T[Schedule next reminder]
    S -->|No| U[Stop reminder sequence]
```

**Key Screens**:
- `/follow-ups` - `FollowUps.tsx`
- Modal: `QuickFollowupModal.tsx`
- Drawer: `FollowUpPreviewDrawer.tsx`

**Automation Logic**:
- **Scheduling**: Automatic T-3, Due, +7 day reminders
- **Templates**: Gentle → Professional → Firm escalation
- **Channels**: WhatsApp (implemented), Email (planned)
- **Tracking**: Complete message history in `message_log`

## 👥 Client Management Flow

### Client Onboarding & Communication
```mermaid
flowchart TD
    A[Add New Client] --> B[Client Information Form]
    B --> C[Enter Basic Details]
    C --> D[WhatsApp Number]
    D --> E[Email Address]
    E --> F[Business Details - GSTIN]
    F --> G[Save Client Profile]
    
    G --> H[Client Dashboard View]
    H --> I[Privacy-Protected List]
    I --> J{View Client Details?}
    
    J -->|Yes| K[Full Client Profile]
    J -->|No| L[Masked Contact Info]
    
    K --> M[Complete Contact Information]
    K --> N[Invoice History]
    K --> O[Communication Log]
    K --> P[Quick Actions]
    
    P --> Q[Create Invoice for Client]
    P --> R[Send Follow-up Message]
    P --> S[Edit Client Information]
    
    Q --> T[Invoice Creation Flow]
    R --> U[Follow-up Flow]
    S --> V[Client Edit Modal]
```

**Key Components**:
- `/clients` - `Clients.tsx`
- Modal: `AddClientModal.tsx`, `EditClientModal.tsx`
- Detail: `ClientDetails.tsx`

**Privacy Features**:
- **Data Masking**: Email and phone numbers masked in list views
- **Detail Access**: Full information only in detail modals
- **Secure Storage**: Sensitive data properly stored and retrieved

## 📊 Dashboard & Analytics Flow

### Business Metrics & Quick Actions
```mermaid
flowchart TD
    A[User opens Dashboard] --> B[Load Dashboard Metrics]
    B --> C[This Month Revenue]
    B --> D[Outstanding Amount]  
    B --> E[Tasks Due 7 Days]
    B --> F[Recent Activities]
    
    F --> G[Recent Invoices]
    F --> H[Recent Payments]
    F --> I[Upcoming Tasks]
    F --> J[Follow-up Reminders]
    
    G --> K{Quick Action?}
    H --> K
    I --> K
    J --> K
    
    K -->|Create Invoice| L[New Invoice Flow]
    K -->|Add Client| M[Client Creation Flow]
    K -->|Add Task| N[Task Creation Flow]
    K -->|Send Reminder| O[Follow-up Flow]
    
    L --> P[Invoice Creation]
    M --> Q[Client Onboarding]
    N --> R[Task Management]
    O --> S[Reminder System]
```

**Key Components**:
- `/` - `Index.tsx` (Dashboard)
- Widget: `QuickActionsWidget.tsx`
- Data: `v_dashboard_metrics` view

**Real-time Updates**:
- **TanStack Query**: Automatic cache invalidation
- **Optimistic Updates**: Instant UI feedback
- **Background Refresh**: Polling for real-time metrics

## ✅ Task Management Flow

### Billable Work Tracking
```mermaid
flowchart TD
    A[Create New Task] --> B[Task Details Form]
    B --> C[Task Title & Description]
    C --> D[Assign to Client/Project]
    D --> E[Set Due Date & Reminder]
    E --> F[Mark as Billable?]
    
    F -->|Yes| G[Billable Task Created]
    F -->|No| H[Regular Task Created]
    
    G --> I[Task Appears in Dashboard]
    H --> I
    
    I --> J{Task Due Soon?}
    J -->|Yes| K[Show in Due Tasks Widget]
    J -->|No| L[Regular Task List]
    
    K --> M{Task Completed?}
    L --> M
    
    M -->|Yes| N[Mark as Done]
    M -->|No| O[Continue Tracking]
    
    N --> P{Is Billable Task?}
    P -->|Yes| Q[Convert to Invoice Item?]
    P -->|No| R[Archive Completed Task]
    
    Q -->|Yes| S[Create Invoice with Task]
    Q -->|No| R
    
    S --> T[Invoice Creation Flow]
```

**Key Components**:
- `/tasks` - `Tasks.tsx`
- Modal: `AddTaskModal.tsx`

**Business Integration**:
- **Billable Tracking**: Links to invoice creation
- **Project Association**: Groups tasks under client projects
- **Deadline Management**: Due date alerts and reminders

## ⚙️ Settings & Configuration Flow

### Business Setup & Customization
```mermaid
flowchart TD
    A[Open Settings] --> B[Business Profile Tab]
    B --> C[Company Information]
    C --> D[Creator Display Name]
    D --> E[Company Address]
    E --> F[GSTIN & Tax Info]
    
    F --> G[UPI & Payment Tab]
    G --> H[UPI VPA Configuration]
    H --> I[Default GST Percentage]
    I --> J[Invoice Prefix]
    
    J --> K[Branding Tab]
    K --> L[Logo Upload - Planned]
    L --> M[Invoice Footer Message]
    
    M --> N[Save Configuration]
    N --> O[Settings Applied Globally]
    
    O --> P[Invoice Generation Uses Settings]
    O --> Q[Payment Links Use UPI VPA]
    O --> R[Branding Applied to PDFs]
```

**Key Components**:
- `/settings` - `Settings.tsx`
- Data: `settings` table

**Configuration Impact**:
- **Invoice Generation**: All invoices use saved settings
- **Payment Integration**: UPI VPA required for payment links
- **Branding**: Company info appears on all documents

## 🧪 Quality Assurance Flow

### Built-in Testing System
```mermaid
flowchart TD
    A[Access QA Dashboard] --> B[Demo Data Status]
    B --> C{Demo Data Exists?}
    
    C -->|No| D[Optional: Populate Demo Data]
    C -->|Yes| E[Run Test Suite]
    
    D --> F[Create Sample Clients]
    F --> G[Create Sample Invoices]
    G --> H[Create Sample Tasks]
    H --> E
    
    E --> I[Feature Tests]
    I --> J[Client Management Tests]
    I --> K[Invoice Creation Tests]
    I --> L[Payment Flow Tests]
    I --> M[Follow-up System Tests]
    
    J --> N{Tests Pass?}
    K --> N
    L --> N
    M --> N
    
    N -->|Yes| O[All Systems Operational]
    N -->|No| P[Show Test Failures]
    
    P --> Q[Debug Failed Features]
    Q --> R[Fix Issues & Re-test]
    R --> E
```

**Key Components**:
- `/qa` - `QA.tsx`
- Framework: `qa/featureTests.ts`, `qa/testRunner.ts`

**Testing Strategy**:
- **Feature Validation**: End-to-end workflow testing
- **Data Independence**: Tests skip gracefully without demo data
- **Regression Prevention**: Automated validation on changes

## 🔄 Error Handling & Recovery

### Graceful Failure Management
```mermaid
flowchart TD
    A[User Action] --> B{Network Available?}
    B -->|No| C[Show Offline Message]
    B -->|Yes| D[Send Request]
    
    D --> E{Request Successful?}
    E -->|Yes| F[Update UI & Cache]
    E -->|No| G[Check Error Type]
    
    G --> H{Authentication Error?}
    G --> I{Validation Error?}
    G --> J{Server Error?}
    
    H -->|Yes| K[Redirect to Login]
    I -->|Yes| L[Show Form Errors]
    J -->|Yes| M[Show Retry Option]
    
    L --> N[User Fixes Input]
    M --> O[User Retries Action]
    
    N --> A
    O --> A
    
    F --> P[Success Feedback]
    C --> Q[Queue Action for Retry]
    Q --> R[Retry When Online]
```

**Error Handling Strategy**:
- **Toast Notifications**: User-friendly error messages
- **Optimistic Updates**: Instant UI feedback with rollback
- **Retry Logic**: Automatic and manual retry options
- **Graceful Degradation**: Core features work even with limited connectivity

## 📱 Mobile-First Experience

### Responsive Design Patterns
```mermaid
flowchart TD
    A[User Access] --> B{Device Type?}
    
    B -->|Mobile| C[Mobile-Optimized Layout]
    B -->|Tablet| D[Tablet Layout]
    B -->|Desktop| E[Full Desktop Layout]
    
    C --> F[Bottom Navigation]
    C --> G[Touch-Friendly Buttons]
    C --> H[Swipe Gestures]
    
    D --> I[Sidebar Navigation]
    D --> J[Grid Layouts]
    
    E --> K[Full Sidebar]
    E --> L[Multi-Column Layouts]
    
    F --> M[Core App Features]
    G --> M
    H --> M
    I --> M
    J --> M
    K --> M
    L --> M
    
    M --> N[Responsive Components]
    N --> O[Optimized for Indian Users]
```

**Mobile Optimizations**:
- **Touch Targets**: 44px minimum touch targets
- **Thumb Navigation**: Bottom-aligned primary actions
- **Readable Text**: 16px base font size, good contrast
- **Fast Loading**: Optimized images and lazy loading
- **Offline Support**: Core features work without connectivity