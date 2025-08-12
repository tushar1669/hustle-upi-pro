import { createContext, useContext, ReactNode } from "react";
import { useCelebrate } from "@/hooks/useCelebrate";
import { SuccessOverlay } from "@/components/celebrations/SuccessOverlay";

const CelebrationContext = createContext<ReturnType<typeof useCelebrate> | null>(null);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const celebration = useCelebrate();

  return (
    <CelebrationContext.Provider value={celebration}>
      {children}
      <SuccessOverlay
        type={celebration.celebration.type || "task_done"}
        isVisible={celebration.celebration.isVisible}
        onComplete={celebration.completeCelebration}
      />
    </CelebrationContext.Provider>
  );
}

export function useCelebrationContext() {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error("useCelebrationContext must be used within CelebrationProvider");
  }
  return context;
}