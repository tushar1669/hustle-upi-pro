import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, AlertCircle } from 'lucide-react';

export function EmailVerificationBanner() {
  const { user, resendVerification } = useAuth();

  // Only show if user exists and email is not confirmed
  if (!user || user.email_confirmed_at) {
    return null;
  }

  return (
    <Alert className="mb-4 border-warning bg-warning/10">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>Email Verification Required</span>
        <Button
          variant="outline"
          size="sm"
          onClick={resendVerification}
          className="h-8"
        >
          <Mail className="h-3 w-3 mr-1" />
          Resend
        </Button>
      </AlertTitle>
      <AlertDescription>
        Please check your email and click the verification link to complete your account setup.
      </AlertDescription>
    </Alert>
  );
}