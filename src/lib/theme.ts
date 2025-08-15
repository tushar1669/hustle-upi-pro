// HustleHub Brand Theme Configuration
export const hustleHubTheme = {
  colors: {
    // Primary Brand Colors
    primary: {
      DEFAULT: '#17B897', // Teal
      50: '#E8F8F4',
      100: '#D1F1E9',
      200: '#A3E3D3',
      300: '#75D5BD',
      400: '#47C7A7',
      500: '#17B897', // Main brand color
      600: '#149378',
      700: '#106E5A',
      800: '#0D493C',
      900: '#09241E',
    },
    accent: {
      DEFAULT: '#F58220', // Orange
      50: '#FEF3E8',
      100: '#FDE7D1',
      200: '#FBCFA3',
      300: '#F9B775',
      400: '#F79F47',
      500: '#F58220', // Main accent color
      600: '#C4681A',
      700: '#934E13',
      800: '#62340D',
      900: '#311A06',
    },
    // Semantic Colors
    success: {
      DEFAULT: '#10B981',
      foreground: '#ffffff',
    },
    warning: {
      DEFAULT: '#F59E0B',
      foreground: '#ffffff',
    },
    danger: {
      DEFAULT: '#EF4444',
      foreground: '#ffffff',
    },
    // Neutral Colors
    neutral: {
      DEFAULT: '#6B7280',
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },
  // Brand Assets
  assets: {
    logo: '/public/assets/Logo_hustlehub.png',
    fullLogo: '/public/assets/Full_Logo_hustlehub.png',
  },
  // Typography
  typography: {
    fontFamily: {
      brand: ['Inter', 'system-ui', 'sans-serif'],
    },
  },
} as const;

export type HustleHubTheme = typeof hustleHubTheme;