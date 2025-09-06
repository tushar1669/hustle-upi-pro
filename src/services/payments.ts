/**
 * Pure utility functions for UPI payments, INR formatting, WhatsApp links, and GSTIN validation
 * No React, Supabase, or DOM dependencies - only standard JavaScript
 */

/**
 * Format an amount as Indian Rupees with proper localization
 * @param amount - The numeric amount to format
 * @returns Formatted string like "₹1,23,456.50"
 */
export function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Sanitize a phone number to only digits, handling Indian country code
 * @param phone - The input phone number string
 * @returns Sanitized digits string
 */
export function sanitizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  
  // If starts with 91 and has more than 10 digits total, keep as is
  if (digits.startsWith("91") && digits.length > 10) {
    return digits;
  }
  
  return digits;
}

/**
 * Sanitize phone number specifically for WhatsApp wa.me links
 * Converts various Indian phone formats to 91XXXXXXXXXX format
 * @param phone - The input phone number string
 * @returns Phone number in wa.me format (91XXXXXXXXXX) or empty string if invalid
 */
export function sanitizePhoneForWhatsApp(phone: string): string {
  if (!phone) return "";
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");
  
  // Handle various Indian phone number formats
  if (digits.length === 10 && digits.match(/^[6-9]/)) {
    // 10-digit Indian mobile starting with 6-9
    return "91" + digits;
  } else if (digits.length === 12 && digits.startsWith("91") && digits.substring(2).match(/^[6-9]/)) {
    // 12-digit with 91 prefix
    return digits;
  } else if (digits.length === 13 && digits.startsWith("091")) {
    // 13-digit with 091 prefix, convert to 91
    return "91" + digits.substring(3);
  }
  
  return ""; // Invalid format
}

/**
 * Validate if a phone number is a valid Indian mobile number
 * @param phone - The input phone number string
 * @returns Object with validation result and error message
 */
export function validateIndianMobile(phone: string): { valid: boolean; error?: string } {
  if (!phone.trim()) {
    return { valid: true }; // Allow empty (optional field)
  }
  
  const sanitized = sanitizePhoneForWhatsApp(phone);
  if (!sanitized) {
    return { 
      valid: false, 
      error: "Please enter a valid Indian mobile number (10 digits starting with 6-9)" 
    };
  }
  
  return { valid: true };
}

/**
 * Build a UPI payment intent URL with proper encoding
 * @param params - UPI payment parameters
 * @returns UPI deeplink string
 */
export function buildUpiIntent(params: {
  pa: string;
  pn: string;
  am: number | string;
  tn?: string;
}): string {
  const queryParams = new URLSearchParams();
  
  // Ensure all parameters are properly encoded
  queryParams.set("pa", params.pa);
  queryParams.set("pn", params.pn);
  queryParams.set("am", String(params.am));
  
  if (params.tn) {
    // Format transaction note as INVHH-<invoice_number> (no spaces)
    queryParams.set("tn", params.tn);
  }
  
  return `upi://pay?${queryParams.toString()}`;
}

/**
 * Build a WhatsApp URL with pre-filled message
 * @param params - WhatsApp URL parameters
 * @returns WhatsApp web URL
 */
export function buildWhatsAppUrl(params: {
  phone: string;
  text: string;
}): string {
  const sanitizedPhone = sanitizePhoneForWhatsApp(params.phone);
  if (!sanitizedPhone) {
    throw new Error("Invalid phone number for WhatsApp");
  }
  const encodedText = encodeURIComponent(params.text);
  return `https://wa.me/${sanitizedPhone}?text=${encodedText}`;
}

/**
 * Validate GSTIN checksum using modulus-36 algorithm
 * @param gstin - The GSTIN string to validate
 * @returns Validation result with boolean and optional reason
 */
export function validateGstinChecksum(gstin: string): {
  valid: boolean;
  reason?: string;
} {
  const trimmedGstin = gstin.trim().toUpperCase();
  
  // Check length
  if (trimmedGstin.length !== 15) {
    return { valid: false, reason: "length" };
  }
  
  // Check alphanumeric charset
  if (!/^[0-9A-Z]+$/.test(trimmedGstin)) {
    return { valid: false, reason: "charset" };
  }
  
  // Modulus-36 checksum algorithm
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let sum = 0;
  
  for (let i = 0; i < 14; i++) {
    const char = trimmedGstin[i];
    const value = chars.indexOf(char);
    
    if (value === -1) {
      return { valid: false, reason: "charset" };
    }
    
    let product = value * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  
  const remainder = sum % 36;
  const checkDigit = remainder === 0 ? 0 : 36 - remainder;
  const expectedChar = chars[checkDigit];
  const actualChar = trimmedGstin[14];
  
  if (expectedChar !== actualChar) {
    return { valid: false, reason: "checksum" };
  }
  
  return { valid: true };
}

/**
 * Build invoice reminder message text and UPI intent
 * @param input - Invoice reminder parameters
 * @returns Object with formatted message and UPI intent
 */
export function buildInvoiceReminderText(input: {
  clientName: string;
  invoiceNumber: string;
  amountINR: number;
  dueDateISO: string;
  status: "draft" | "sent" | "overdue" | "paid";
  upiVpa: string;
  businessName: string;
}): { message: string; upiIntent: string } {
  let dueString: string;
  
  if (input.status === "paid") {
    dueString = "This invoice is already marked as paid.";
  } else if (input.status === "overdue") {
    const dueDate = new Date(input.dueDateISO);
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    dueString = `${diffDays} days overdue`;
  } else {
    const dueDate = new Date(input.dueDateISO);
    const day = dueDate.getDate().toString().padStart(2, "0");
    const month = (dueDate.getMonth() + 1).toString().padStart(2, "0");
    const year = dueDate.getFullYear();
    dueString = `due on ${day}/${month}/${year}`;
  }
  
  const upiIntent = buildUpiIntent({
    pa: input.upiVpa,
    pn: input.businessName,
    am: input.amountINR,
    tn: `INVHH-${input.invoiceNumber}`,
  });
  
  const message = `Hi ${input.clientName},\n\nJust a reminder for Invoice ${input.invoiceNumber} — ${formatINR(input.amountINR)} (${dueString}).\n\nPay via UPI:\n${upiIntent}\n\nThank you!`;
  
  return { message, upiIntent };
}

/**
 * Build invoice reminder email content with subject and body
 * @param input - Invoice reminder parameters
 * @returns Object with formatted subject, body, and UPI intent
 */
export function buildInvoiceReminderEmail(input: {
  clientName: string;
  invoiceNumber: string;
  amountINR: number;
  dueDateISO: string;
  upiVpa: string;
  businessName: string;
}): { subject: string; body: string; upiIntent: string } {
  const dueDate = new Date(input.dueDateISO);
  const formattedDate = dueDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const subject = `Invoice ${input.invoiceNumber} due on ${formattedDate}`;
  
  const upiIntent = buildUpiIntent({
    pa: input.upiVpa,
    pn: input.businessName,
    am: input.amountINR,
    tn: `INVHH-${input.invoiceNumber}`,
  });

  const body = `Hi ${input.clientName},

Invoice ${input.invoiceNumber} for ₹${input.amountINR.toLocaleString("en-IN")} is due on ${formattedDate}.

Please make payment using the UPI link below:
${upiIntent}

Thank you!
${input.businessName}`;

  return { subject, body, upiIntent };
}

/**
 * Build a mailto URL with encoded subject and body
 * @param params - Email parameters
 * @returns mailto URL string
 */
export function buildMailtoUrl(params: {
  email: string;
  subject: string;
  body: string;
}): string {
  const queryParams = new URLSearchParams();
  queryParams.set('subject', params.subject);
  queryParams.set('body', params.body);
  
  return `mailto:${encodeURIComponent(params.email)}?${queryParams.toString()}`;
}
