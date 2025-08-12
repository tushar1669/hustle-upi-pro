import { useState, useCallback } from "react";

type CelebrationType = "invoice_sent" | "reminder_sent" | "mark_paid" | "task_done";

interface CelebrationState {
  type: CelebrationType | null;
  isVisible: boolean;
}

export function useCelebrate() {
  const [celebration, setCelebration] = useState<CelebrationState>({
    type: null,
    isVisible: false,
  });

  const celebrate = useCallback((type: CelebrationType) => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // For reduced motion users, just show a simple toast
      return;
    }

    setCelebration({ type, isVisible: true });
  }, []);

  const completeCelebration = useCallback(() => {
    setCelebration({ type: null, isVisible: false });
  }, []);

  return {
    celebration,
    celebrate,
    completeCelebration,
  };
}