import { TextStyle, ViewStyle } from 'react-native';

// 1. Define Color Palette based on your Tailwind config
const palette = {
  black: '#000000',
  white: '#FFFFFF',
  background: '#020205', // Deep background from your snippet
  
  // Zinc Scale (approximate values for UI/Surface)
  zinc300: '#d4d4d8',
  zinc400: '#a1a1aa',
  zinc500: '#71717a',
  zinc600: '#52525b',
  zinc700: '#3f3f46',
  zinc800: '#27272a',
  zinc900: '#18181b',
  zinc950: '#09090b',

  // Brand Colors
  indigo400: '#818cf8',
  indigo500: '#6366f1',
  indigo600: '#4f46e5',
  
  // Secondary / Status
  purple400: '#c084fc',
  purple500: '#a855f7',
  purple600: '#9333ea',
  emerald400: '#34d399',
  orange400: '#ff9f0a',
  red500: '#ff453a',
};

// 2. The Theme Object
export const theme = {
  colors: {
    background: palette.background,
    text: {
      primary: palette.white,
      secondary: palette.zinc400,
      tertiary: palette.zinc600,
      brand: palette.indigo400,
      rest: palette.purple400,
      // Additional zinc variants
      zinc400: palette.zinc400,
      zinc500: palette.zinc500,
      zinc600: palette.zinc600,
      zinc700: palette.zinc700,
      zinc800: palette.zinc800,
    },
    ui: {
      border: 'rgba(255, 255, 255, 0.05)', // border-light
      glass: 'rgba(24, 24, 27, 0.6)', // glass-bg
      glassStrong: 'rgba(2, 2, 5, 0.9)', // glass-strong-bg
      surfaceHighlight: 'rgba(255, 255, 255, 0.05)',
      progressBg: palette.zinc950, // zinc-950 for progress bars
      
      // Brand tints
      primaryLight: 'rgba(99, 102, 241, 0.1)', // indigo-500/10 / brand-surface
      primaryBorder: 'rgba(99, 102, 241, 0.3)',
      brandGlow: 'rgba(99, 102, 241, 0.5)', // brand-glow
      brandSurface: 'rgba(99, 102, 241, 0.1)', // brand-surface
    },
    status: {
      active: palette.indigo500,
      success: palette.emerald400,
      rest: palette.purple400,
      warning: palette.orange400,
      error: palette.red500,
    }
  },

  // Spacing (mapping tailwind classes like p-5, p-6)
  spacing: {
    xs: 4,   // gap-1
    s: 8,    // p-2
    m: 16,   // p-4 / rounded-2xl
    l: 20,   // p-5
    xl: 24,  // p-6
    xxl: 32, // mb-8
    xxxl: 48, // mb-12
    xxxxl: 64, // mb-16
    xxxxxl: 80, // mb-20
    xxxxxxl: 96, // mb-24
    navHeight: 80, // For bottom padding
  },

  // Border Radius (matching CSS variables)
  borderRadius: {
    m: 12,   // rounded-xl
    l: 16,   // rounded-2xl (backward compatibility)
    lg: 24,  // radius-lg (1.5rem)
    xl: 32,  // radius-xl (2rem)
    xxl: 40, // radius-xxl (2.5rem)
    full: 9999,
    bento: 40, // bento-card (2.5rem)
    popover: 32, // popover-menu (2rem)
  },

  // Typography (Based on CSS design system)
  typography: {
    // Families - Use 'Inter' and 'JetBrains Mono' when fonts are loaded
    fonts: {
      sans: 'Inter', // 'Inter-Regular', 'Inter-Medium', 'Inter-SemiBold', 'Inter-Bold', 'Inter-ExtraBold', 'Inter-Black'
      mono: 'JetBrains Mono', // 'JetBrainsMono-Regular', 'JetBrainsMono-Bold'
    },
    
    // Size Presets
    sizes: {
      xxs: 10,   // text-[8px] -> increased
      xs: 12,    // text-[10px] -> increased
      s: 16,     // text-sm -> increased
      m: 18,     // text-base -> increased
      l: 22,     // text-xl -> increased
      xl: 28,    // text-2xl -> increased
      xxl: 36,   // text-3xl -> increased
      xxxl: 48,   // text-4xl -> increased
      hero: 108, // text-hero (4.5rem) -> increased
      h1: 42,    // text-h1 (2.25rem) -> increased
      h2: 36,    // text-h2 (1.875rem) -> increased
      h3: 30,    // text-h3 (1.5rem) -> increased
      h4: 24,    // text-h4 (1rem) -> increased
      label: 11, // text-label (9px) -> increased
      labelTight: 12, // text-label-tight (10px) -> increased
      mono: 14,  // text-mono (0.75rem) -> increased
      data: 20,  // text-data (1.125rem) -> increased
    },

    // Letter Spacing (tracking)
    tracking: {
      tight: -0.5,
      wide: 1.5,      // tracking-widest
      wider: 2,
      ultra: 3,       // tracking-[0.2em]
      hero: -4.8,     // -0.05em for hero (4.5rem * -0.05)
      h1: -1.8,       // -0.05em for h1 (2.25rem * -0.05)
      h2: -1.5,       // -0.05em for h2 (1.875rem * -0.05)
      h3: -0.4,       // -0.02em for h3 (1.25rem * -0.02)
      h4: -0.2,       // -0.02em for h4 (1rem * -0.02)
      label: 3.6,     // 0.4em for label (9px * 0.4)
      labelTight: 1,  // 0.1em for label-tight (10px * 0.1)
      data: -0.36,    // -0.02em for data (18px * -0.02)
    }
  }
};

// 3. Typography Styles (Based on CSS design system)
export const typographyStyles = {
  hero: {
    fontSize: theme.typography.sizes.hero,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: theme.typography.tracking.hero,
    color: theme.colors.text.primary,
  } as TextStyle,
  
  h1: {
    fontSize: theme.typography.sizes.h1,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: theme.typography.tracking.h1,
    color: theme.colors.text.primary,
  } as TextStyle,
  
  h2: {
    fontSize: theme.typography.sizes.h2,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: theme.typography.tracking.h2,
    color: theme.colors.text.primary,
  } as TextStyle,
  
  h3: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: theme.typography.tracking.h3,
    textTransform: 'uppercase',
    color: theme.colors.text.primary,
  } as TextStyle,

  h4: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: theme.typography.tracking.h4,
    textTransform: 'uppercase',
    color: theme.colors.text.primary,
  } as TextStyle,
  
  label: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: theme.typography.tracking.label,
    color: theme.colors.text.primary,
  } as TextStyle,
  
  labelTight: {
    fontSize: theme.typography.sizes.labelTight,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: theme.typography.tracking.labelTight,
    color: theme.colors.text.primary,
  } as TextStyle,
  
  mono: {
    fontFamily: theme.typography.fonts.mono,
    fontSize: theme.typography.sizes.mono,
    fontWeight: '700',
    color: theme.colors.text.primary,
  } as TextStyle,
  
  data: {
    fontSize: theme.typography.sizes.data,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: theme.typography.tracking.data,
    color: theme.colors.text.primary,
  } as TextStyle,
  
  labelMuted: { 
    fontSize: theme.typography.sizes.s,
    fontWeight: '600',
    letterSpacing: theme.typography.tracking.wider,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
   } as TextStyle,

   muscleName: {
    fontSize: theme.typography.sizes.m,
    fontWeight: '900',
    color: theme.colors.text.primary,
   } as TextStyle,

   body: {
    fontSize: theme.typography.sizes.m,
    fontWeight: '400',
    color: theme.colors.text.primary,
    lineHeight: 24,
   } as TextStyle,

  // Color variants
  textIndigo: { color: theme.colors.status.active } as TextStyle,
  textZincDim: { color: palette.zinc500 } as TextStyle,
  textZincMuted: { color: palette.zinc600 } as TextStyle,
  textEmerald: { color: theme.colors.status.success } as TextStyle,
  textPurple: { color: theme.colors.status.rest } as TextStyle,
};

// 4. Helper for the "Glass Panel" effect in React Native
// Usage: ...commonStyles.glassPanel
export const commonStyles = {
  glassPanel: {
    backgroundColor: theme.colors.ui.glass,
    borderColor: theme.colors.ui.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xxl,
    // Note: React Native needs a library like 'expo-blur' for real backdrop filters.
    // This serves as a fallback visual style.
  } as ViewStyle,
  
  glassStrong: {
    backgroundColor: theme.colors.ui.glassStrong,
    borderColor: theme.colors.ui.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xxl,
  } as ViewStyle,
  
  bentoCard: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.bento,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  } as ViewStyle,
  
  shadow: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  } as ViewStyle,
  
  popoverShadow: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 20,
  } as ViewStyle,

  headingItalic: {
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: theme.colors.text.primary,
  } as TextStyle,
  
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: theme.colors.ui.progressBg,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  } as ViewStyle,
  
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.status.active,
  } as ViewStyle,
  
  // Brand glow effect
  brandGlow: {
    backgroundColor: theme.colors.ui.brandGlow,
    borderRadius: theme.borderRadius.full,
    filter: 'blur(120px)',
  } as ViewStyle,
  
  // Brand surface (for buttons, cards with brand color)
  brandSurface: {
    backgroundColor: theme.colors.ui.brandSurface,
    borderColor: theme.colors.ui.primaryBorder,
  } as ViewStyle,
  
  // Icon button styles
  iconButton: {
    padding: 10,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    backgroundColor: theme.colors.ui.glass,
  } as ViewStyle,
  
  iconButtonPrimary: {
    backgroundColor: theme.colors.ui.brandSurface,
    borderColor: theme.colors.ui.primaryBorder,
  } as ViewStyle,
  
  iconButtonDark: {
    backgroundColor: theme.colors.ui.glass,
    borderColor: theme.colors.ui.border,
  } as ViewStyle,

  backButton: {
    padding: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    backgroundColor: theme.colors.ui.glass,
  } as ViewStyle,
};
