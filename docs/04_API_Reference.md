# HustleHub MVP - API Reference

## Overview

HustleHub uses Supabase PostgREST for all database operations through a collections-based abstraction layer. All endpoints are RESTful and return JSON responses.

**Base URL:** `https://jldeysxlrcvggssvighb.supabase.co/rest/v1/`
**Authentication:** None required (MVP mode)
**Content-Type:** `application/json`

## Collections API

### Settings

#### settings_one()
Get application settings (single row).

**Method:** Internal collection function
**Purpose:** Retrieve global app configuration

**JavaScript Usage:**
```javascript
import { settings_one } from '@/data/collections';

const settings = await settings_one();
```

**Response:**
```json
{
  "id": 1,
  "creator_display_name": "Freelancer Pro",
  "upi_vpa": "freelancer@paytm",
  "default_gst_percent": 18.00,
  "invoice_prefix": "HH",
  "logo_url": "/uploads/logo.png",
  "created_at": "2025-08-12T19:05:54.466984+00:00",
  "owner_id": null
}
```

**Direct REST API:**
```bash
curl "https://jldeysxlrcvggssvighb.supabase.co/rest/v1/settings?select=*&limit=1" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**React Query Usage:**
```javascript
const { data: settings } = useQuery({
  queryKey: CACHE_KEYS.SETTINGS,
  queryFn: settings_one
});
```

---

### Clients

#### clients_all()
Get all clients ordered by creation date.

**JavaScript Usage:**
```javascript
import { clients_all } from '@/data/collections';

const clients = await clients_all();
```

**Response:**
```json
[
  {
    "id": "1cb3bb63-645e-447d-b894-01fb0e907ca5",
    "name": "Acme Studios",
    "whatsapp": "+91-9876543210",
    "email": "contact@acme.com",
    "address": "123 Business Street, Mumbai, Maharashtra 400001",
    "gstin": "27ABCDE1234F1Z5",
    "suggested_hour": "14:00:00",
    "upi_vpa": "acme@paytm",
    "created_at": "2025-08-12T19:05:54.466984+00:00",
    "owner_id": null
  }
]
```

**Direct REST API:**
```bash
curl "https://jldeysxlrcvggssvighb.supabase.co/rest/v1/clients?select=*&order=created_at.desc" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### create_client(data)
Create a new client.

**Parameters:**
- `name` (required): Client business name
- `whatsapp` (optional): WhatsApp number for reminders
- `email` (optional): Email address
- `address` (optional): Business address
- `gstin` (optional): GST identification number
- `upi_vpa` (optional): UPI payment address

**JavaScript Usage:**
```javascript
import { create_client } from '@/data/collections';

const clientData = {
  name: "New Client Inc",
  whatsapp: "+91-9876543210",
  email: "hello@newclient.com",
  address: "456 New Street, Delhi",
  gstin: "07ABCDE5678F9Z0",
  upi_vpa: "newclient@upi"
};

const newClient = await create_client(clientData);
```

**Direct REST API:**
```bash
curl -X POST "https://jldeysxlrcvggssvighb.supabase.co/rest/v1/clients" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Client Inc",
    "whatsapp": "+91-9876543210",
    "email": "hello@newclient.com",
    "upi_vpa": "newclient@upi"
  }'
```

**Cache Invalidation:** Triggers invalidation of CLIENTS and PROJECTS cache keys.

#### update_client(id, data)
Update existing client information.

**JavaScript Usage:**
```javascript
import { update_client } from '@/data/collections';

const updatedClient = await update_client(clientId, {
  upi_vpa: "newpayment@upi",
  address: "Updated address"
});
```

#### delete_client(id)
Delete a client (if no associated invoices).

**JavaScript Usage:**
```javascript
import { delete_client } from '@/data/collections';

await delete_client(clientId);
```

---

### Projects

#### projects_all()
Get all projects with client information.

**JavaScript Usage:**
```javascript
import { projects_all } from '@/data/collections';

const projects = await projects_all();
```

**Response:**
```json
[
  {
    "id": "ec179890-acae-4ed6-ad13-9dafe4cbcdbd",
    "client_id": "1cb3bb63-645e-447d-b894-01fb0e907ca5",
    "name": "Website Revamp",
    "is_billable": true,
    "created_at": "2025-08-12T19:05:54.466984+00:00",
    "owner_id": null,
    "client": {
      "name": "Acme Studios"
    }
  }
]
```

#### projects_by_client(clientId)
Get projects for a specific client.

**JavaScript Usage:**
```javascript
import { projects_by_client } from '@/data/collections';

const clientProjects = await projects_by_client(clientId);
```

#### create_project(data)
Create a new project.

**Parameters:**
- `client_id` (required): Associated client UUID
- `name` (required): Project name
- `is_billable` (optional): Whether tasks default to billable (default: true)

**JavaScript Usage:**
```javascript
import { create_project } from '@/data/collections';

const projectData = {
  client_id: "1cb3bb63-645e-447d-b894-01fb0e907ca5",
  name: "Mobile App Development",
  is_billable: true
};

const newProject = await create_project(projectData);
```

---

### Invoices

#### invoices_all()
Get all invoices with client and project information.

**JavaScript Usage:**
```javascript
import { invoices_all } from '@/data/collections';

const invoices = await invoices_all();
```

**Response:**
```json
[
  {
    "id": "628e60d5-108f-4da3-b130-28e59e0eb881",
    "invoice_number": "HH-2025-1003",
    "client_id": "1cb3bb63-645e-447d-b894-01fb0e907ca5",
    "project_id": "ec179890-acae-4ed6-ad13-9dafe4cbcdbd",
    "issue_date": "2025-07-23",
    "due_date": "2025-08-07",
    "subtotal": 10000.00,
    "gst_amount": 1800.00,
    "total_amount": 11800.00,
    "status": "overdue",
    "paid_date": null,
    "utr_reference": null,
    "upi_qr_svg": null,
    "share_url": null,
    "created_at": "2025-08-12T19:05:54.466984+00:00",
    "owner_id": null,
    "client": {
      "name": "Acme Studios",
      "upi_vpa": "acme@paytm"
    },
    "project": {
      "name": "Website Revamp"
    }
  }
]
```

#### invoice_by_id(id)
Get a specific invoice with full details.

**JavaScript Usage:**
```javascript
import { invoice_by_id } from '@/data/collections';

const invoice = await invoice_by_id("628e60d5-108f-4da3-b130-28e59e0eb881");
```

#### create_invoice(data)
Create a new invoice.

**Parameters:**
- `invoice_number` (required): Auto-generated format HH-YYYY-NNNN
- `client_id` (required): Client UUID
- `project_id` (optional): Project UUID  
- `issue_date` (required): ISO date string
- `due_date` (required): ISO date string
- `subtotal` (required): Amount before GST
- `gst_amount` (required): Calculated GST amount
- `total_amount` (required): Final amount (subtotal + GST)
- `status` (required): 'draft' or 'sent'

**JavaScript Usage:**
```javascript
import { create_invoice } from '@/data/collections';

const invoiceData = {
  invoice_number: "HH-2025-1004",
  client_id: "1cb3bb63-645e-447d-b894-01fb0e907ca5",
  project_id: "ec179890-acae-4ed6-ad13-9dafe4cbcdbd",
  issue_date: "2025-08-12",
  due_date: "2025-08-27",
  subtotal: 25000.00,
  gst_amount: 4500.00,
  total_amount: 29500.00,
  status: "sent"
};

const newInvoice = await create_invoice(invoiceData);
```

**Side Effects:**
- If status='sent': Creates 3 reminders (3, 7, 14 days after issue_date)
- Generates UPI QR code if client or settings have UPI VPA
- Creates message_log entry

**Direct REST API:**
```bash
curl -X POST "https://jldeysxlrcvggssvighb.supabase.co/rest/v1/invoices" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_number": "HH-2025-1004",
    "client_id": "1cb3bb63-645e-447d-b894-01fb0e907ca5",
    "issue_date": "2025-08-12",
    "due_date": "2025-08-27",
    "subtotal": 25000.00,
    "gst_amount": 4500.00,
    "total_amount": 29500.00,
    "status": "sent"
  }'
```

#### update_invoice(id, data)
Update existing invoice.

**Common Use Case - Mark as Paid:**
```javascript
import { update_invoice } from '@/data/collections';

const paidInvoice = await update_invoice(invoiceId, {
  status: 'paid',
  paid_date: new Date().toISOString().split('T')[0],
  utr_reference: 'UTR-123456789'
});
```

**Direct REST API - Mark Paid:**
```bash
curl -X PATCH "https://jldeysxlrcvggssvighb.supabase.co/rest/v1/invoices?id=eq.628e60d5-108f-4da3-b130-28e59e0eb881" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid",
    "paid_date": "2025-08-12",
    "utr_reference": "UTR-123456789"
  }'
```

**Cache Invalidation:** Triggers invalidation of INVOICES, DASHBOARD, MESSAGES cache keys.

---

### Invoice Items

#### items_by_invoice(invoiceId)
Get line items for a specific invoice.

**JavaScript Usage:**
```javascript
import { items_by_invoice } from '@/data/collections';

const items = await items_by_invoice("628e60d5-108f-4da3-b130-28e59e0eb881");
```

**Response:**
```json
[
  {
    "id": "item-uuid-1",
    "invoice_id": "628e60d5-108f-4da3-b130-28e59e0eb881",
    "title": "UI Design Sprint",
    "qty": 5,
    "rate": 2000.00,
    "amount": 10000.00,
    "owner_id": null
  }
]
```

#### create_item(data)
Add line item to invoice.

**Parameters:**
- `invoice_id` (required): Parent invoice UUID
- `title` (required): Item description
- `qty` (required): Quantity
- `rate` (required): Price per unit
- `amount` (required): Total amount (qty × rate)

**JavaScript Usage:**
```javascript
import { create_item } from '@/data/collections';

const itemData = {
  invoice_id: "628e60d5-108f-4da3-b130-28e59e0eb881",
  title: "Brand Identity Design",
  qty: 1,
  rate: 15000.00,
  amount: 15000.00
};

const newItem = await create_item(itemData);
```

#### delete_item(id)
Remove line item from invoice.

**JavaScript Usage:**
```javascript
import { delete_item } from '@/data/collections';

await delete_item(itemId);
```

---

### Tasks

#### tasks_all()
Get all tasks with project and client information.

**JavaScript Usage:**
```javascript
import { tasks_all } from '@/data/collections';

const tasks = await tasks_all();
```

**Response:**
```json
[
  {
    "id": "task-uuid-1",
    "project_id": "ec179890-acae-4ed6-ad13-9dafe4cbcdbd",
    "title": "Send assets to Acme",
    "description": "Deliver final design assets and documentation",
    "due_date": "2025-08-15",
    "status": "open",
    "is_billable": true,
    "billable_rate": 1500.00,
    "linked_invoice_id": null,
    "created_at": "2025-08-12T19:05:54.466984+00:00",
    "owner_id": null,
    "project": {
      "name": "Website Revamp",
      "client": {
        "name": "Acme Studios"
      }
    }
  }
]
```

#### create_task(data)
Create a new task.

**Parameters:**
- `project_id` (optional): Associated project UUID
- `title` (required): Task description
- `description` (optional): Detailed notes
- `due_date` (optional): ISO date string
- `is_billable` (optional): Whether task is chargeable (default: false)
- `billable_rate` (optional): Hourly rate if billable

**JavaScript Usage:**
```javascript
import { create_task } from '@/data/collections';

const taskData = {
  project_id: "ec179890-acae-4ed6-ad13-9dafe4cbcdbd",
  title: "Client feedback review",
  description: "Review and incorporate client feedback on designs",
  due_date: "2025-08-20",
  is_billable: true,
  billable_rate: 1800.00
};

const newTask = await create_task(taskData);
```

#### update_task(id, data)
Update task information or status.

**Mark Task as Done:**
```javascript
import { update_task } from '@/data/collections';

const completedTask = await update_task(taskId, {
  status: 'done'
});
```

**Link Task to Invoice:**
```javascript
const linkedTask = await update_task(taskId, {
  status: 'done',
  linked_invoice_id: invoiceId
});
```

**Cache Invalidation:** Triggers invalidation of TASKS, DASHBOARD, MESSAGES cache keys.

---

### Reminders

#### reminders_by_invoice(invoiceId)
Get reminders for a specific invoice.

**JavaScript Usage:**
```javascript
import { reminders_by_invoice } from '@/data/collections';

const reminders = await reminders_by_invoice("5ebe3709-8b54-4179-a0f4-89e2d7b37d81");
```

**Response:**
```json
[
  {
    "id": "reminder-uuid-1",
    "invoice_id": "5ebe3709-8b54-4179-a0f4-89e2d7b37d81",
    "scheduled_at": "2025-08-13T14:00:00+00:00",
    "channel": "whatsapp",
    "status": "pending",
    "created_at": "2025-08-12T19:05:54.466984+00:00",
    "owner_id": null
  },
  {
    "id": "reminder-uuid-2", 
    "invoice_id": "5ebe3709-8b54-4179-a0f4-89e2d7b37d81",
    "scheduled_at": "2025-08-17T14:00:00+00:00",
    "channel": "whatsapp",
    "status": "pending",
    "created_at": "2025-08-12T19:05:54.466984+00:00",
    "owner_id": null
  },
  {
    "id": "reminder-uuid-3",
    "invoice_id": "5ebe3709-8b54-4179-a0f4-89e2d7b37d81", 
    "scheduled_at": "2025-08-24T14:00:00+00:00",
    "channel": "whatsapp",
    "status": "pending",
    "created_at": "2025-08-12T19:05:54.466984+00:00",
    "owner_id": null
  }
]
```

#### create_reminder(data)
Create a new reminder (usually automatic).

**Parameters:**
- `invoice_id` (required): Target invoice UUID
- `scheduled_at` (required): When to send reminder
- `channel` (required): 'whatsapp', 'email', or 'manual'
- `status` (optional): Default 'pending'

**JavaScript Usage:**
```javascript
import { create_reminder } from '@/data/collections';

const reminderData = {
  invoice_id: "5ebe3709-8b54-4179-a0f4-89e2d7b37d81",
  scheduled_at: "2025-08-20T14:00:00Z",
  channel: "whatsapp",
  status: "pending"
};

const newReminder = await create_reminder(reminderData);
```

#### update_reminder(id, data)
Update reminder status (typically when sent).

**Mark Reminder as Sent:**
```javascript
import { update_reminder } from '@/data/collections';

const sentReminder = await update_reminder(reminderId, {
  status: 'sent'
});
```

---

### Message Log

#### message_log_recent()
Get recent communication logs.

**JavaScript Usage:**
```javascript
import { message_log_recent } from '@/data/collections';

const recentLogs = await message_log_recent();
```

**Response:**
```json
[
  {
    "id": "log-uuid-1",
    "related_type": "invoice",
    "related_id": "5ebe3709-8b54-4179-a0f4-89e2d7b37d81",
    "channel": "whatsapp",
    "sent_at": "2025-08-12T14:30:00+00:00",
    "template_used": "invoice_sent",
    "outcome": "delivered",
    "owner_id": null
  }
]
```

#### create_message_log(data)
Log a communication event.

**Parameters:**
- `related_type` (required): Entity type ('invoice', 'task', 'reminder')
- `related_id` (required): Entity UUID
- `channel` (optional): Communication channel
- `template_used` (optional): Message template name
- `outcome` (optional): Result of communication

**JavaScript Usage:**
```javascript
import { create_message_log } from '@/data/collections';

const logData = {
  related_type: "reminder",
  related_id: reminderId,
  channel: "whatsapp",
  template_used: "reminder_sent", 
  outcome: "delivered"
};

const logEntry = await create_message_log(logData);
```

---

### Dashboard

#### v_dashboard_metrics()
Get KPI metrics for dashboard.

**JavaScript Usage:**
```javascript
import { v_dashboard_metrics } from '@/data/collections';

const metrics = await v_dashboard_metrics();
```

**Response:**
```json
{
  "this_month_paid": 29500,
  "overdue_amount": 11800,
  "tasks_due_7d": 2
}
```

**Direct REST API:**
```bash
curl "https://jldeysxlrcvggssvighb.supabase.co/rest/v1/v_dashboard_metrics?select=*" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**React Query Usage:**
```javascript
const { data: metrics } = useQuery({
  queryKey: CACHE_KEYS.DASHBOARD,
  queryFn: v_dashboard_metrics,
  refetchInterval: 30000 // Refresh every 30 seconds
});
```

## Error Handling

### HTTP Status Codes

**200 OK** - Successful operation
**201 Created** - Resource created successfully  
**400 Bad Request** - Invalid request data
**401 Unauthorized** - Authentication required (N/A in MVP)
**403 Forbidden** - Access denied (N/A in MVP)
**404 Not Found** - Resource not found
**409 Conflict** - Duplicate resource (e.g., invoice number)
**500 Internal Server Error** - Server-side error

### Error Response Format

```json
{
  "code": "PGRST116",
  "details": "The result contains 0 rows",
  "hint": null,
  "message": "JSON object requested, multiple (or no) rows returned"
}
```

### Common Error Scenarios

**Duplicate Invoice Number:**
```json
{
  "code": "23505",
  "message": "duplicate key value violates unique constraint",
  "details": "Key (invoice_number)=(HH-2025-1003) already exists."
}
```

**Foreign Key Violation:**
```json
{
  "code": "23503", 
  "message": "insert or update on table violates foreign key constraint",
  "details": "Key (client_id)=(invalid-uuid) is not present in table \"clients\"."
}
```

**Invalid Status Transition:**
```json
{
  "code": "23514",
  "message": "new row for relation violates check constraint",
  "details": "Failing row contains (paid, draft, ...)"
}
```

## Rate Limiting

**Current:** No rate limiting (MVP single-user)
**Future:** Supabase built-in rate limiting per project

## Authentication

**Current:** No authentication required
**Headers:** Only API key required

```bash
# Required header for all requests
-H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Future:** JWT-based authentication
```bash
# Future authentication headers
-H "apikey: your-anon-key"
-H "Authorization: Bearer jwt-token"
```

## Data Validation

### Client Validation
- name: Required, max 255 characters
- email: Valid email format if provided
- whatsapp: Valid phone number format
- gstin: Valid GSTIN format (15 alphanumeric)
- upi_vpa: Valid UPI format (user@provider)

### Invoice Validation  
- invoice_number: Unique, format HH-YYYY-NNNN
- amounts: Positive numbers, total = subtotal + gst
- dates: due_date >= issue_date, paid_date >= issue_date
- status: Valid enum values

### Task Validation
- title: Required, max 255 characters
- billable_rate: Positive if is_billable = true
- status: Valid enum progression

## Cache Management

### React Query Integration

All collection functions integrate with React Query for automatic caching:

```javascript
// Automatic caching with stale-while-revalidate
const { data, isLoading, error } = useQuery({
  queryKey: CACHE_KEYS.INVOICES,
  queryFn: invoices_all,
  staleTime: 5 * 60 * 1000 // 5 minutes
});
```

### Cache Invalidation Patterns

**After Invoice Operations:**
```javascript
// Automatically triggered after create/update/delete
await Promise.all([
  queryClient.invalidateQueries({ queryKey: CACHE_KEYS.INVOICES }),
  queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD }),
  queryClient.invalidateQueries({ queryKey: CACHE_KEYS.MESSAGES })
]);
```

**Optimistic Updates:**
```javascript
// Update UI immediately, sync in background
const markPaidMutation = useMutation({
  mutationFn: (data) => update_invoice(invoiceId, data),
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: CACHE_KEYS.INVOICES });
    
    // Optimistically update cache
    queryClient.setQueryData(CACHE_KEYS.INVOICES, (old) => 
      old.map(inv => inv.id === invoiceId ? { ...inv, ...newData } : inv)
    );
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(CACHE_KEYS.INVOICES, context.previousData);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.INVOICES });
  }
});
```

## Integration Examples

### Complete Invoice Creation Flow

```javascript
// 1. Create invoice
const invoice = await create_invoice({
  invoice_number: "HH-2025-1004",
  client_id: selectedClient.id,
  project_id: selectedProject.id,
  issue_date: "2025-08-12",
  due_date: "2025-08-27", 
  subtotal: 25000.00,
  gst_amount: 4500.00,
  total_amount: 29500.00,
  status: "sent"
});

// 2. Add line items
await Promise.all([
  create_item({
    invoice_id: invoice.id,
    title: "UI Design",
    qty: 5,
    rate: 3000.00,
    amount: 15000.00
  }),
  create_item({
    invoice_id: invoice.id,
    title: "Frontend Development", 
    qty: 2,
    rate: 5000.00,
    amount: 10000.00
  })
]);

// 3. System automatically creates 3 reminders
// 4. UPI QR code generated if client has UPI VPA
// 5. Message log entry created
// 6. Cache invalidated for real-time UI updates
```

### Mark Invoice Paid Flow

```javascript
// Update invoice status
const paidInvoice = await update_invoice(invoiceId, {
  status: 'paid',
  paid_date: '2025-08-12',
  utr_reference: 'UTR-123456789'
});

// Log the payment
await create_message_log({
  related_type: "invoice",
  related_id: invoiceId,
  template_used: "payment_received",
  outcome: "confirmed"
});

// KPIs update automatically via cache invalidation
```

### Send Reminder Flow

```javascript
// Update reminder status
await update_reminder(reminderId, {
  status: 'sent'
});

// Log the communication
await create_message_log({
  related_type: "reminder", 
  related_id: reminderId,
  channel: "whatsapp",
  template_used: "reminder_sent",
  outcome: "delivered"
});
```
