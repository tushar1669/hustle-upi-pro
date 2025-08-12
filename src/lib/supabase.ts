// Lightweight Supabase client accessor for Lovable native integration
// Assumes the platform provides a pre-configured client on window.supabase
// We avoid env variables per platform guidelines

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = (): any => {
  const w = window as unknown as { supabase?: unknown };
  if (!w.supabase) {
    throw new Error("Supabase client not available. Ensure the Lovable Supabase integration is connected (green button at top-right).");
  }
  return w.supabase as any;
};

export type UUID = string;

export const todayISO = () => new Date().toISOString();
