/**
 * Redaction helpers for masking sensitive data in UI previews
 */

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return phone;
  
  if (phone.startsWith('+91')) {
    // Handle Indian numbers: +91 ******3210
    const lastFour = phone.slice(-4);
    return `+91 ******${lastFour}`;
  }
  
  // General format: show first 3 and last 4
  if (phone.length > 7) {
    const start = phone.slice(0, 3);
    const end = phone.slice(-4);
    const stars = '*'.repeat(Math.max(0, phone.length - 7));
    return `${start}${stars}${end}`;
  }
  
  return phone;
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  
  const [local, domain] = email.split('@');
  if (local.length <= 1) return email;
  
  const maskedLocal = local[0] + '*'.repeat(Math.max(0, local.length - 1));
  return `${maskedLocal}@${domain}`;
}

export function maskVPA(vpa: string): string {
  if (!vpa || !vpa.includes('@')) return vpa;
  
  const [local, domain] = vpa.split('@');
  if (local.length <= 1) return vpa;
  
  const maskedLocal = local[0] + '*'.repeat(Math.max(0, local.length - 1));
  return `${maskedLocal}@${domain}`;
}