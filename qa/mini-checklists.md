# HustleHub — Mini QA Checklists

> Fast 2–4 min runs per PR. Keep demo gating in mind: when VITE_DEMO_MODE=true, writes should be blocked with friendly toasts.

## 1) feat: Entries manager for Savings Goals (view & delete)
- [ ] Create a goal; add 2 entries
- [ ] Open Entries drawer → newest-first list
- [ ] Delete one entry → list + progress update
- [ ] Delete last entry → empty state appears

## 2) fix: Allow changing Project when editing a Task
- [ ] Create projects A and B; create task under A
- [ ] Edit task → change project to B → Save
- [ ] Verify list + "Filter by B" shows task

## 3) demo-mode gating
- [ ] Set VITE_DEMO_MODE=true → rebuild preview
- [ ] Save Draft invoice → "Demo mode: saving is disabled"
- [ ] Mark as Paid → "Demo mode: updates are disabled"
- [ ] Flip to false + sign in → actions succeed

## 4) Polish pack (Follow-ups + Projects + Tasks UX)
- [ ] Follow-ups: client w/o email → Email disabled + tooltip
- [ ] Loading skeletons for Follow-ups & Projects
- [ ] Forced error shows friendly card with Refresh
- [ ] Tasks add/edit: Save shows spinner; due date ≥ today

## 5) B pack (Should-have)
- [ ] Follow-ups quick reschedule: +3 days → toast + list update
- [ ] Clients validation: bad email/phone/UPI → inline errors; Save disabled until fixed
- [ ] Invoices: Mark as sent + Undo sent; "Copy details" works; "Share" works/fallback copies

## 6) C pack (Hardening)
- [ ] RLS: impersonate current user → data visible; different UUID → empty; no session → empty
- [ ] Invoices: Mark Paid sets `paid_at`; Undo Paid clears it; "overdue" only when non-paid and due in past
- [ ] FK friendly errors for Projects and Clients deletions

## 7) Stabilize core flows
- [ ] Create invoices → numbers increment per year (`…0001`, `…0002`)
- [ ] No collisions/crashes on rapid saves
- [ ] InvoicesList loads; Follow-ups reads `paid_at` only

## 8) Go-Live pass (final sweep)
- [ ] Draft → Sent → Undo → Paid → Undo Paid (caches invalidate)
- [ ] Demo mode on/off verified
- [ ] Error toasts show Supabase messages

Notes:
- To impersonate a user in SQL: 
  select set_config('request.jwt.claims', json_build_object('role','authenticated','sub','<USER_UUID>')::text, true);