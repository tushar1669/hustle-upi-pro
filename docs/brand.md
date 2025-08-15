# HustleHub Brand Guidelines

## Brand Colors

### Primary Colors
- **Primary Teal**: `#17B897` - Main brand color for buttons, links, and primary actions
- **Accent Orange**: `#F58220` - Secondary accent color for highlights and calls-to-action

### Semantic Colors
- **Success**: `#10B981` - For positive actions, confirmations, and success states
- **Warning**: `#F59E0B` - For alerts, warnings, and attention-required states
- **Danger**: `#EF4444` - For errors, destructive actions, and critical alerts

### Neutral Colors
- **Background**: Pure white (`#FFFFFF`) / Dark mode (`#0F172A`)
- **Foreground**: Dark gray (`#1E293B`) / Light mode text
- **Muted**: Light gray (`#64748B`) for secondary text and subtle elements

## Logo Usage

### Assets
- **Main Logo**: `/public/assets/Logo_hustlehub.png`
- **Full Logo**: `/public/assets/Full_Logo_hustlehub.png` (for favicon and full branding)

### Usage Guidelines
- Use the main logo in navigation headers and primary brand placements
- Use the full logo for favicons and compact brand representations
- Maintain clear space around logos (minimum 16px)
- Do not stretch, skew, or modify logo proportions

## Color Token Usage

### Tailwind Classes
Use semantic color tokens instead of hard-coded hex values:

```css
/* ✅ Correct */
bg-primary text-primary-foreground
bg-accent text-accent-foreground
bg-success text-success-foreground
bg-warning text-warning-foreground
bg-danger text-danger-foreground

/* ❌ Incorrect */
bg-[#17B897] text-white
bg-[#F58220] text-white
```

### Component Applications

#### Buttons
- **Primary actions**: `variant="default"` (teal background)
- **Secondary actions**: `variant="secondary"` (gray background)
- **Call-to-action**: `variant="gradient"` (teal to orange gradient)
- **Success actions**: `variant="success"` (green background)
- **Destructive actions**: `variant="destructive"` (red background)

#### Status Badges
- **Active/Paid**: `variant="success"`
- **Pending/Draft**: `variant="warning"`
- **Overdue/Error**: `variant="danger"`
- **Featured/New**: `variant="accent"`

#### KPI Cards
- **Primary metrics**: Use `bg-primary` with `text-primary-foreground`
- **Secondary metrics**: Use `bg-card` with accent borders
- **Status indicators**: Use appropriate semantic colors

#### Navigation
- **Active states**: `bg-primary` or `text-primary`
- **Hover states**: `hover:bg-primary/10` for subtle highlighting
- **Sidebar accents**: Use `sidebar-accent` tokens

## Typography

### Font Family
- **Primary**: Inter, system-ui, sans-serif
- **Fallback**: System default sans-serif stack

### Hierarchy
- **Headings**: Use semantic heading tags (h1-h6) with consistent spacing
- **Body text**: Use `text-foreground` for primary text
- **Secondary text**: Use `text-muted-foreground` for less important information

## Implementation Examples

### KPI Card with Brand Colors
```tsx
<Card className="border-primary/20">
  <CardHeader className="bg-primary text-primary-foreground">
    <CardTitle>Total Revenue</CardTitle>
  </CardHeader>
  <CardContent className="pt-6">
    <div className="text-accent text-2xl font-bold">$12,345</div>
  </CardContent>
</Card>
```

### Status Badge
```tsx
<Badge variant="success">Paid</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Overdue</Badge>
```

### Call-to-Action Button
```tsx
<Button variant="gradient" size="lg">
  Create Invoice
</Button>
```

## Design Principles

1. **Consistency**: Always use defined color tokens, never hard-coded values
2. **Accessibility**: Ensure sufficient contrast ratios (4.5:1 minimum)
3. **Hierarchy**: Use color intentionally to guide user attention
4. **Branding**: Maintain teal as primary with orange as accent throughout
5. **Semantic**: Use semantic colors (success, warning, danger) for appropriate contexts

## Dark Mode Support

All color tokens automatically support dark mode through CSS custom properties. The theme system adjusts brightness and contrast for optimal dark mode experience while maintaining brand recognition.