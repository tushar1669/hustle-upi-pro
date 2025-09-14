# HustleHub — Mini QA Checklists (2–4 min each)

> Preflight (always):
> - Note Demo mode in header: ON blocks writes with friendly toasts; OFF allows writes
> - You should see "Demo: ON/OFF, Session: Auth/Anon" in /qa
> - If lists are empty, press **Populate Demo Data** (this seeds only QA-prefixed items)

## 1) Clients — CRUD & Validation
- [ ] Click "Add Client" → modal opens (fields have labels + inline errors)
- [ ] Enter bad email → "Enter a valid email" appears; **Save disabled**
- [ ] Enter valid name/email → in Live: saves and appears in list; in Demo/Anon: gating toast appears
**Pass if:** modal loads, validation fires, correct gating in Demo/Anon.

## 2) Tasks — Edit Project Assignment
- [ ] Open any task → "Edit"
- [ ] Change Project via dropdown (No Project = "none" sentinel, not blank)
- [ ] Click Save
**Pass if:** modal shows project select and Save; change applies in Live; toast gates in Demo/Anon.

## 3) Invoices — Create & Tabs
- [ ] /invoices/new loads with invoice number for current year (…0001/…0002)
- [ ] "Save Draft" shows Demo gating in Demo/Anon; saves in Live
- [ ] /invoices → tabs "All/Draft/Sent/Overdue/Paid" filter correctly
**Pass if:** page loads, gating/saves correct, tabs filter list.

## 4) Invoices — Mark Paid & Undo
- [ ] Row menu shows **Mark as Paid** when status ≠ paid; opens modal
- [ ] Set date → confirm → status = paid, `paid_at` set (Live); Demo/Anon shows gating toast
- [ ] Undo Paid resets to draft, clears `paid_at` (Live)
**Pass if:** menu item visible when expected; `paid_at` used consistently.

## 5) Follow-ups — Quick Reschedule & Channels
- [ ] Open Follow-ups → pick a reminder → "Quick Reschedule" → **+3 days**
- [ ] Email button disabled if client lacks email; WhatsApp available
**Pass if:** reschedule toasts, list updates; email disabled state correct.

## 6) Savings — Entries Drawer
- [ ] Open a goal → "View Entries" → newest-first list
- [ ] Add entry (Live) / toast (Demo/Anon)
- [ ] Delete last entry → empty state shows
**Pass if:** drawer works; add/delete path correct for mode.

## 7) Settings — Required Fields
- [ ] Confirm fields exist: UPI VPA, Display Name, Invoice Prefix, Company Name, Default GST%
- [ ] Save (Live) / toast (Demo/Anon)
**Pass if:** 5 fields visible; Save behaves per mode.

## 8) Hardening — RLS & Errors
- [ ] Try deleting a Project with tasks → friendly FK message
- [ ] (Optional SQL) Impersonate another UUID → lists empty
**Pass if:** FK messages are human; RLS yields empty for other UUID/no session.

## 9) Navigation — Active States
- [ ] Visit `/`, `/invoices`, `/settings`
**Pass if:** active nav state highlights for each.

## 10) Export QA Report
- [ ] /qa → Run Feature Tests → Export Report
**Pass if:** downloads **qa-results-YYYY-MM-DD.json** + **qa-report-YYYY-MM-DD.md**