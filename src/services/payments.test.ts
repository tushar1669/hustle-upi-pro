/**
 * Test utilities for payment service functions
 * Simple assertions for core UPI and phone sanitization
 */

import { 
  buildUpiIntent, 
  sanitizePhoneForWhatsApp, 
  validateIndianMobile,
  buildInvoiceReminderText,
  formatINR 
} from './payments';

// Simple test assertion helper
function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

// Test UPI URI generation with new tn format
console.log('\n=== UPI URI Tests ===');

const upiTest1 = buildUpiIntent({
  pa: "test@upi",
  pn: "Test Business",
  am: 1000,
  tn: "INVHH-2025-0001"
});

assert(
  upiTest1.includes("tn=INVHH-2025-0001"),
  "UPI URI should contain compact transaction note format"
);

assert(
  upiTest1.startsWith("upi://pay?"),
  "UPI URI should start with correct scheme"
);

console.log('Sample UPI URI:', upiTest1);

// Test phone sanitization for WhatsApp
console.log('\n=== Phone Sanitization Tests ===');

// Test case 1: 10-digit Indian mobile
const phone1 = sanitizePhoneForWhatsApp("9876543210");
assert(phone1 === "919876543210", "10-digit number should get 91 prefix");

// Test case 2: +91 format
const phone2 = sanitizePhoneForWhatsApp("+91 98765 43210");
assert(phone2 === "919876543210", "+91 format should be cleaned and normalized");

// Test case 3: Already has 91 prefix
const phone3 = sanitizePhoneForWhatsApp("919876543210");
assert(phone3 === "919876543210", "Already correct format should remain unchanged");

// Test case 4: Invalid number
const phone4 = sanitizePhoneForWhatsApp("1234567890");
assert(phone4 === "", "Invalid number should return empty string");

console.log('Phone test results:');
console.log('9876543210 →', phone1);
console.log('+91 98765 43210 →', phone2);
console.log('919876543210 →', phone3);
console.log('1234567890 →', phone4);

// Test phone validation
console.log('\n=== Phone Validation Tests ===');

const val1 = validateIndianMobile("9876543210");
assert(val1.valid === true, "Valid 10-digit number should pass validation");

const val2 = validateIndianMobile("1234567890");
assert(val2.valid === false, "Invalid number should fail validation");

const val3 = validateIndianMobile("");
assert(val3.valid === true, "Empty string should be valid (optional field)");

console.log('Validation results:');
console.log('9876543210:', val1);
console.log('1234567890:', val2);
console.log('(empty):', val3);

// Test invoice reminder text with new tn format
console.log('\n=== Invoice Reminder Tests ===');

const reminderTest = buildInvoiceReminderText({
  clientName: "Test Client",
  invoiceNumber: "2025-0001",
  amountINR: 5000,
  dueDateISO: "2025-01-15T00:00:00Z",
  status: "sent",
  upiVpa: "business@paytm",
  businessName: "Test Business"
});

assert(
  reminderTest.upiIntent.includes("tn=INVHH-2025-0001"),
  "Invoice reminder should use new compact tn format"
);

assert(
  reminderTest.message.includes("₹5,000.00"),
  "Message should contain formatted INR amount"
);

console.log('Sample reminder message:');
console.log(reminderTest.message);
console.log('\nSample UPI intent:');
console.log(reminderTest.upiIntent);

console.log('\n=== All Tests Complete ===');