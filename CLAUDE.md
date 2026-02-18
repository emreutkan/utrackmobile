# Force Mobile - Design System Guide

## Overview

Force Mobile is a fitness tracking app with a **neural-brutalist** design aesthetic featuring dark themes, glass morphism, and bold italic typography. This guide documents the core visual patterns for maintaining consistency across all screens.

---

## Color System

### Base Colors

```typescript
background: '#020205'; // Deep black - use for all screen backgrounds
```

### Glass Morphism

```typescript
glass: 'rgba(24, 24, 27, 0.6)'; // Semi-transparent cards
glassStrong: 'rgba(2, 2, 5, 0.9)'; // Nearly opaque overlays
border: 'rgba(255, 255, 255, 0.05)'; // Subtle light borders (always 1px)
```

### Brand Colors

```typescript
indigo: '#6366f1'; // Primary brand (buttons, active states)
purple: '#a855f7'; // Secondary brand (rest, recovery)
```

### Status Colors

```typescript
active: '#6366f1'; // Indigo - active workouts, primary actions
success: '#34d399'; // Emerald - completed states, ready
warning: '#ff9f0a'; // Orange - volume metrics, alerts
rest: '#c084fc'; // Purple - rest days, recovery
error: '#ff453a'; // Red - errors, negative values
```

### Text Hierarchy

```typescript
primary: '#FFFFFF'; // Main headings, primary data
secondary: '#a1a1aa'; // Supporting text, timestamps (zinc-400)
tertiary: '#52525b'; // Subtle labels, metadata (zinc-600)
brand: '#818cf8'; // Brand accents (indigo-400)
```

---

## Typography System

### Heading Styles (Always Italic + 900 Weight)

**Hero Title** (Brand moments only)

```typescript
fontSize: 108px
fontWeight: '900'
fontStyle: 'italic'
letterSpacing: -4.8
color: primary
// Usage: "FORCE." with colored dot accent
```

**H1** (Main screen headers)

```typescript
fontSize: 42px
fontWeight: '900'
fontStyle: 'italic'
letterSpacing: -1.8
textTransform: 'uppercase' // Sometimes
color: primary
// Usage: HomeHeader "FORCE.", major titles
```

**H2** (Large data displays)

```typescript
fontSize: 36px
fontWeight: '900'
fontStyle: 'italic'
letterSpacing: -1.5
color: primary
```

**H3** (Section headers - MOST COMMON)

```typescript
fontSize: 30px
fontWeight: '900'
fontStyle: 'italic'
textTransform: 'uppercase'
letterSpacing: -0.4
color: primary
// Usage: "MUSCLE RECOVERY", "TEMPLATES", feature sections
```

**H4** (Subsection headers)

```typescript
fontSize: 24px
fontWeight: '900'
fontStyle: 'italic'
textTransform: 'uppercase'
letterSpacing: -0.2
color: primary
```

### Label Styles (Always Uppercase)

**Label** (Feature tags, badges)

```typescript
fontSize: 11px
fontWeight: '900'
textTransform: 'uppercase'
letterSpacing: 3.6  // Very wide spacing!
color: primary
// Usage: "ANALYTICS", "PRO", feature identifiers
```

**Label Tight** (Card headers, metric labels)

```typescript
fontSize: 12px
fontWeight: '900'
textTransform: 'uppercase'
letterSpacing: 1.0
color: primary
// Usage: "BEST 1RM", "PROGRESS", card labels
```

**Label Muted** (Subtle section labels)

```typescript
fontSize: 16px
fontWeight: '600'
textTransform: 'uppercase'
letterSpacing: 2.0
color: tertiary
// Usage: "HISTORY", "ANALYTICS" subtle labels
```

### Data Display (Metrics, Numbers)

**Data** (Metric values - ALWAYS use tabular-nums!)

```typescript
fontSize: 20px
fontWeight: '900'
fontStyle: 'italic'
letterSpacing: -0.36
fontVariant: ['tabular-nums']  // CRITICAL for alignment
color: primary
// Usage: Recovery percentages, set numbers, stats
```

**Large Values** (Hero metrics)

```typescript
fontSize: 28-48px
fontWeight: '900'
fontStyle: 'italic'
fontVariant: ['tabular-nums']  // CRITICAL
color: primary
// Usage: 1RM values, large metric cards
```

**Body Text**

```typescript
fontSize: 18px
fontWeight: '400'
lineHeight: 24
color: primary or secondary
// Usage: Descriptions, paragraphs (rare - app is data-heavy)
```

---

## Spacing System (8px Base Grid)

```typescript
xs: 4px    // Tight gaps within elements
s: 8px     // Standard element padding, gaps
m: 16px    // Card padding, section gaps (MOST COMMON)
l: 20px    // Larger card padding
xl: 24px   // Major section padding
xxl: 32px  // Large vertical spacing
xxxl: 48px // Major section breaks
```

### Common Patterns

- **Card padding**: `theme.spacing.m` (16px) or `theme.spacing.l` (20px)
- **Section margin bottom**: `theme.spacing.m` (16px)
- **Card gaps**: `theme.spacing.s` (8px)
- **Screen padding**: `theme.spacing.s` (8px) or 12px

---

## Border Radius System

```typescript
m: 12px    // Small buttons, badges
l: 16px    // Standard cards (MOST COMMON)
xl: 32px   // Large cards
xxl: 40px  // Prominent cards, primary buttons
bento: 40px // Special large cards
full: 9999  // Circular elements
```

---

## Background Gradients (CRITICAL PATTERN)

### Standard Screen Gradient

**Every screen uses this exact gradient:**

```tsx
<LinearGradient
  colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
  style={StyleSheet.absoluteFillObject}
/>
```

- Position: Absolute fill
- Fades from top (indigo glow) to transparent
- Applied to: Home, Workouts, Exercise Stats, Active Workout, ALL screens

### Hero/Feature Gradients (Special screens only)

```tsx
<LinearGradient
  colors={['rgba(99, 102, 241, 0.3)', 'rgba(99, 102, 241, 0.1)', 'transparent']}
  locations={[0, 0.5, 1]}
  style={styles.bgGlow}
/>
```

- Used in: Hero screen, special feature screens
- Creates stronger top glow effect

---

## Card Patterns

### Standard Glass Card (Most Common)

```typescript
{
  backgroundColor: theme.colors.ui.glass,        // rgba(24, 24, 27, 0.6)
  borderRadius: theme.borderRadius.l,            // 16px
  padding: theme.spacing.m,                      // 16px
  borderWidth: 1,
  borderColor: theme.colors.ui.border,           // rgba(255, 255, 255, 0.05)
}
```

**Usage**: MuscleRecoverySection cards, list items, compact displays

### Prominent Card (Hero cards)

```typescript
{
  backgroundColor: theme.colors.ui.glass,
  borderRadius: theme.borderRadius.xxl,          // 40px (Bento style)
  padding: theme.spacing.xl,                     // 24px
  borderWidth: 1,
  borderColor: theme.colors.ui.border,
}
```

**Usage**: ActiveSection workout card, TrainingIntensityCard, major features

### Card Header Pattern

```tsx
<View style={styles.cardHeader}>
  <Ionicons name="icon" size={14} color={theme.colors.status.warning} />
  <Text style={styles.cardLabel}>LABEL</Text>
</View>
```

**Styling**:

```typescript
cardHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginBottom: 8,
}
cardLabel: {
  fontSize: 10-11,
  fontWeight: '800',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: theme.colors.text.tertiary,
}
```

---

## Icon Patterns

### Icon Containers (Brand Colored)

```typescript
{
  width: 44-48,
  height: 44-48,
  borderRadius: 22-24,  // Perfect circle
  backgroundColor: 'rgba(99, 102, 241, 0.1)',  // 10% opacity brand color
  borderWidth: 1,
  borderColor: 'rgba(99, 102, 241, 0.3)',      // 30% opacity brand color
  justifyContent: 'center',
  alignItems: 'center',
}
```

**Icon inside**: 20-24px Ionicons with full color

**Color Variations**:

- Indigo: `rgba(99, 102, 241, 0.1)` bg, `rgba(99, 102, 241, 0.3)` border
- Orange: `rgba(255, 159, 10, 0.1)` bg, `rgba(255, 159, 10, 0.3)` border
- Emerald: `rgba(52, 211, 153, 0.1)` bg, `rgba(52, 211, 153, 0.3)` border
- Purple: `rgba(192, 132, 252, 0.1)` bg, `rgba(192, 132, 252, 0.3)` border

### Small Icon Containers (Metrics)

```typescript
{
  width: 32-40,
  height: 32-40,
  borderRadius: 8,  // Rounded square
  backgroundColor: 'rgba(99, 102, 241, 0.1)',
  justifyContent: 'center',
  alignItems: 'center',
}
```

**Icon inside**: 16-20px

---

## Button Patterns

### Primary Action Button

```typescript
{
  backgroundColor: theme.colors.status.active,  // #6366f1
  borderRadius: theme.borderRadius.xxl,         // 40px (pill shape)
  paddingVertical: theme.spacing.l,             // 20px
  paddingHorizontal: theme.spacing.xl,          // 24px
  shadowColor: theme.colors.status.active,
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.2,
  shadowRadius: 20,
  elevation: 10,
}

buttonText: {
  fontSize: 18,
  fontWeight: '800',
  fontStyle: 'italic',
  textTransform: 'uppercase',
  letterSpacing: 1.5,
  color: theme.colors.text.primary,
}
```

**Usage**: Hero "START LOGGING", main CTAs

### Glass Icon Buttons

```typescript
{
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: theme.colors.ui.glass,
  borderWidth: 1,
  borderColor: theme.colors.ui.border,
  alignItems: 'center',
  justifyContent: 'center',
}
```

**Usage**: Back buttons, menu buttons, navigation

---

## Section Header Pattern

**Every feature section uses this pattern:**

```tsx
<View style={styles.header}>
  <Text style={typographyStyles.h3}>SECTION NAME</Text>
  <Text style={typographyStyles.labelMuted}>CATEGORY</Text>
</View>
```

**Styling**:

```typescript
header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing.m,
  paddingHorizontal: theme.spacing.xs,
}
```

**Examples**:

- "MUSCLE RECOVERY" + "ANALYTICS"
- "TEMPLATES" + "WORKOUTS"

---

## Metric Display Patterns

### Large Metric Card (2-column grid)

```tsx
<View style={styles.row}>
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Ionicons name="trophy" size={14} color={warning} />
      <Text style={styles.cardLabel}>BEST 1RM</Text>
    </View>
    <View style={styles.valueRow}>
      <Text style={styles.bigValue}>120.5</Text>
      <Text style={styles.unit}>kg</Text>
    </View>
  </View>
</View>
```

**Value Styling**:

```typescript
bigValue: {
  fontSize: 28,
  fontWeight: '900',
  fontVariant: ['tabular-nums'],  // CRITICAL!
  color: theme.colors.text.primary,
}
unit: {
  fontSize: 13,
  fontWeight: '800',
  color: theme.colors.text.tertiary,
}
```

### Progress Bar Pattern

```typescript
progressBar: {
  width: 80,
  height: 4,
  backgroundColor: theme.colors.ui.progressBg,  // zinc-950
  borderRadius: theme.borderRadius.full,
  overflow: 'hidden',
}
progressFill: {
  height: '100%',
  backgroundColor: '#60A5FA',  // Color varies by status
  width: '${percentage}%',
}
```

---

## Screen Structure Pattern

**Every screen follows this structure:**

```tsx
<View style={[styles.container, { paddingTop: insets.top }]}>
  <LinearGradient
    colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
    style={StyleSheet.absoluteFillObject}
  />

  {/* Header */}
  <View style={styles.header}>
    <Pressable style={commonStyles.backButton}>
      <Ionicons name="arrow-back" size={24} color={primary} />
    </Pressable>
    <Text style={styles.title}>SCREEN TITLE</Text>
  </View>

  {/* Content */}
  <ScrollView
    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
    showsVerticalScrollIndicator={false}
  >
    {/* Sections with marginBottom: theme.spacing.m */}
  </ScrollView>
</View>
```

**Container styles**:

```typescript
container: {
  flex: 1,
  backgroundColor: theme.colors.background,  // #020205
}
scrollContent: {
  padding: theme.spacing.s,  // 8px or 12px
}
```

---

## Key Design Principles

### 1. **Italic = Emphasis**

- ALL headings use italic (h1-h4)
- ALL data values use italic
- Creates athletic, dynamic feel

### 2. **Uppercase = Structure**

- ALL section headers uppercase
- ALL labels uppercase
- ALL button text uppercase
- Provides visual hierarchy without size variation

### 3. **Tabular Numerals = Alignment**

- ALWAYS use `fontVariant: ['tabular-nums']` for numbers
- Critical for data tables, metrics, set rows
- Ensures perfect column alignment

### 4. **Glass Morphism = Depth**

- Semi-transparent backgrounds create layering
- Subtle 5% white borders for separation
- Avoid heavy shadows - use borders and layering instead

### 5. **Consistent Spacing**

- 8px base grid strictly followed
- Use theme.spacing constants, never hardcoded values
- Card padding: 16-20px
- Section gaps: 16px
- Screen padding: 8-12px

### 6. **Color Restraint**

- Three-tier text hierarchy (primary/secondary/tertiary)
- Status colors used sparingly for semantic meaning
- Icon containers always use 10% opacity backgrounds

### 7. **Wide Letter Spacing on Labels**

- Labels use 2-3.6px letter spacing
- Creates premium, technical aesthetic
- Improves legibility at small sizes

---

## Common Mistakes to Avoid

❌ **DON'T:**

- Use gradients other than the standard indigo fade
- Hardcode spacing values - always use theme.spacing
- Forget `fontVariant: ['tabular-nums']` on numbers
- Use font weights below 400 (illegible on dark bg)
- Mix border radius values arbitrarily
- Create cards without glass background + border

✅ **DO:**

- Use theme constants for all colors, spacing, typography
- Apply italic style to all headings and data
- Use uppercase for all labels and headers
- Include subtle borders on all cards (1px, 5% white)
- Follow the 8px spacing grid
- Use semantic status colors (success/warning/error)

---

## Quick Reference: Common Component Styles

**Section Header**:

```typescript
<Text style={typographyStyles.h3}>SECTION NAME</Text>
```

**Card Label**:

```typescript
<Text style={typographyStyles.labelTight}>METRIC NAME</Text>
```

**Large Value**:

```typescript
<Text style={{
  fontSize: 28,
  fontWeight: '900',
  fontVariant: ['tabular-nums'],
  color: theme.colors.text.primary
}}>123.4</Text>
```

**Standard Glass Card**:

```typescript
{
  backgroundColor: theme.colors.ui.glass,
  borderRadius: theme.borderRadius.l,
  padding: theme.spacing.m,
  borderWidth: 1,
  borderColor: theme.colors.ui.border,
}
```

**Primary Button**:

```typescript
{
  backgroundColor: theme.colors.status.active,
  borderRadius: theme.borderRadius.xxl,
  paddingVertical: 20,
  paddingHorizontal: 24,
}
```

---

## Files to Reference

- **Theme System**: `constants/theme.ts`
- **Hero Screen**: `app/(hero)/index.tsx` - Typography showcase
- **Home Components**: `app/(tabs)/(home)/components/` - All patterns in use
- **Exercise Stats**: `app/(exercise-statistics)/components/KeyMetrics.tsx` - Metric cards
- **Recovery**: `app/(recovery-status)/components/` - Glass cards, progress bars

---

---

## Account/Settings Screen Refinement (2026-02-15)

**Location**: `app/(account)/index.tsx`

### Design System Updates Applied

**Profile Header:**

- ✅ Avatar: 72x72px with indigo→purple gradient background
- ✅ Avatar text: 32px, italic, 900 weight (matches brand typography)
- ✅ Email: 20px, italic, 900 weight
- ✅ Member since: Label style (11px, uppercase, 2px letter-spacing)
- ✅ 2px gradient border on avatar

**Section Headers:**

- ✅ Updated to use `theme.typography.sizes.label` (11px)
- ✅ Ultra-wide letter-spacing (3.6px) for premium feel
- ✅ Consistent uppercase labels across all sections

**Setting Cards:**

- ✅ Icon boxes: 42x42px circles (larger for better visual weight)
- ✅ Icon background: 8% white opacity with 10% border
- ✅ Title typography: 13px, 900 weight, uppercase, 0.8px spacing
- ✅ Subtitle: 10px, 800 weight, uppercase, 1px spacing

**Stats Cards:**

- ✅ Value typography: 28px, italic, 900 weight with tabular-nums
- ✅ Maintains data display consistency across app

**Modals:**

- ✅ Title: 24px, italic, 900 weight, uppercase, -0.5px spacing
- ✅ Matches H4 heading style from design system

**Subscription Navigation:**

- ✅ Enabled navigation to upgrade screen (line 344 uncommented)

### Pattern Consistency

- Glass morphism maintained throughout
- Standard gradient background applied
- All typography follows design system hierarchy
- Icon containers use circular borders (not rounded squares)
- Proper spacing using theme constants

---

## Subscription Screen Implementation (2026-02-15)

**Location**: `app/(account)/upgrade.tsx`

### Psychological Flow

1. **Visual Hook** - `PremiumPreview` (blurred CNS card with lock) → FOMO
2. **Authority** - "SCIENCE-BACKED ELITE PERFORMANCE" hero → Credibility
3. **Outcomes** - `BenefitsRow` (LIFT MORE • RECOVER FASTER • TRACK EVERYTHING) → Desire
4. **Value Stack** - `FeatureStack` (5 features with benefit copy) → Justification
5. **Price** - `PricingDisplay` ($4.99/mo + daily breakdown) → Anchoring
6. **CTA** - `UnlockButton` (UNLOCK PRO ACCESS) → Action

### Components

- `components/PremiumPreview.tsx` - Locked feature preview with blur overlay
- `components/BenefitsRow.tsx` - 3 outcome-focused benefits with icons
- `components/FeatureStack.tsx` - 5 premium features with gradient icons
- `components/PricingDisplay.tsx` - Price with daily breakdown ($0.17/day)
- `components/UnlockButton.tsx` - Purple gradient CTA button

### Conversion Tactics

- **FOMO**: Blurred preview shows what they're missing
- **Authority**: "TRUSTED BY 10,000+ ATHLETES" social proof
- **Anchoring**: "$0.17/day - less than a protein shake"
- **Value Stack**: 5 features with benefit-focused copy
- **Single CTA**: No "cancel" button, only back arrow (reduces exit friction)
- **Price Last**: Lead with value, show price after justification

---

---

## Global Background Fix (2026-02-15)

**Issue**: White flash appearing between screen transitions

**Solution**: Set consistent background color across all layers

**Files Modified:**

1. **`app/_layout.tsx`**
   - Created `CustomDarkTheme` with `background: #020205`
   - Set `GestureHandlerRootView` background to `theme.colors.background`
   - Updated Stack `contentStyle` to use `theme.colors.background`
   - Added `animation: 'fade'` for smoother transitions

2. **`app.json`**
   - Updated splash screen `backgroundColor`: `#020205` (was `#ffffff`)
   - Updated dark mode splash: `#020205` (was `#000000`)
   - Updated Android adaptive icon: `#020205` (was `#E6F4FE`)

**Result**: No more white flashes during navigation, consistent deep black background throughout the app.

---

## App Loading & Navigation Fix (2026-02-15)

**Issues**:

1. App loaded into account/settings screen first, then jumped to home
2. Throbber showing during navigation transitions
3. Swipe left gesture on home screen bricked the app
4. Duplicate auth logic causing conflicts

**Root Causes**:

- `_layout.tsx` had duplicate auth logic that conflicted with existing `(loading)/index.tsx` screen
- Nested Stack navigators in each tab had swipe gestures enabled, conflicting with tab navigation
- Auth redirects in `_layout.tsx` were executing before the loading screen could handle routing

**Solution**:

1. **Created `app/index.tsx`** (root route)
   - Shows branded "FORCE." logo with indigo dot
   - Matches hero screen aesthetic
   - Immediately redirects to `/(loading)` on mount

2. **Updated `app/(loading)/index.tsx`**
   - Branded loading screen with "FORCE." logo + "NEURAL TRAINING PLATFORM" tagline
   - Strong indigo gradient glow (matches hero screen)
   - Minimum 500ms display time to prevent flashing
   - Handles: token check → user fetch → redirect to auth/home

3. **Simplified `app/_layout.tsx`**
   - Removed duplicate auth logic
   - Added `gestureEnabled: false` globally
   - Reordered Stack.Screen components (index first, account last)

4. **Disabled swipe gestures on all tab Stack navigators**
   - `app/(tabs)/(home)/_layout.tsx` - Added `gestureEnabled: false`
   - `app/(tabs)/(workouts)/_layout.tsx` - Added `gestureEnabled: false`
   - `app/(tabs)/(supplements)/_layout.tsx` - Added `gestureEnabled: false`
   - `app/(tabs)/(calculations)/_layout.tsx` - Added `gestureEnabled: false`

**Flow**:

```
App Launch → index (FORCE. logo) → (loading) (FORCE. logo + auth check) → /(auth) OR /(tabs)/(home)
```

**Result**:

- Branded hero-style loading screen (no spinner/throbber)
- Single source of truth for auth routing (loading screen)
- No more flashing between screens or showing account first
- Swipe gestures disabled, preventing navigation conflicts
- Premium startup experience matching app's neural-brutalist aesthetic

---

## Subscription/RevenueCat Implementation (2026-02-15)

**Location**: `app/(account)/upgrade.tsx`

### Full RevenueCat Integration

**Features Implemented:**

1. ✅ Multiple subscription periods (weekly, monthly, yearly)
2. ✅ Dynamic package selector with savings badges
3. ✅ Smart pricing display adapts to package type
4. ✅ Package type auto-detection
5. ✅ Purchase flow with error handling
6. ✅ Restore purchases functionality
7. ✅ Pro feature gating with `ProFeatureGate` component
8. ✅ Real-time subscription status sync

### Components

**`PackageSelector.tsx`** - Subscription period chooser

- 3-column grid: weekly, monthly, yearly
- Shows "SAVE XX%" badge on yearly plans
- Selected state with purple border + indicator dot
- Glass card style with brand colors

**`PricingDisplay.tsx`** - Dynamic pricing card

- Adapts breakdown text based on package type:
  - Weekly: "$X.XX per day • Flexible weekly plan"
  - Monthly: "$X.XX per day • Less than a protein shake"
  - Yearly: "$X.XX/mo • $X.XX/day • Best value"
- Uses RevenueCat actual pricing
- Supports all currencies

**`ProFeatureGate.tsx`** - Feature locking wrapper

- Blurred preview of locked content (30% opacity)
- Purple gradient overlay with lock icon
- "PRO FEATURE" badge
- Upgrade button with purple gradient
- Navigates to upgrade screen

**`RevenueCatSync.tsx`** - Subscription status sync

- Listens to RevenueCat customer info updates
- Syncs `isPro` status to settings store
- Enables real-time UI updates when subscription changes

**`PackageComparison.tsx`** (optional) - Side-by-side comparison table

- Shows all packages in table format
- Columns: Plan, Price, Per Day
- "BEST VALUE" badge on yearly
- Alternative to PackageSelector

### Utilities: `utils/packageHelpers.ts`

**Core Functions:**

```typescript
getPackageType(pkg); // Returns 'weekly' | 'monthly' | 'yearly'
getPackageLabel(type); // Returns 'WEEKLY' | 'MONTHLY' | 'YEARLY'
getPackagePeriod(type); // Returns '/wk' | '/mo' | '/yr'
calculateSavings(packages, currentPkg); // Returns savings % or null
getBreakdownText(type, price, currency); // Returns pricing breakdown text
sortPackages(packages); // Sorts in display order
```

### Design Patterns

**Savings Badge:**

```typescript
{
  backgroundColor: theme.colors.status.warning,  // Orange #ff9f0a
  borderRadius: theme.borderRadius.m,            // 12px
  paddingHorizontal: 8,
  paddingVertical: 3,
  position: 'absolute',
  top: -8,  // Floats above card
}

badgeText: {
  fontSize: 9,
  fontWeight: '900',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: theme.colors.background,  // Black text on orange
}
```

**Package Card (Selected State):**

```typescript
{
  backgroundColor: 'rgba(192, 132, 252, 0.08)',  // Light purple tint
  borderWidth: 2,
  borderColor: theme.colors.status.rest,          // Purple #c084fc
}
```

**Package Card (Unselected State):**

```typescript
{
  backgroundColor: theme.colors.ui.glass,
  borderWidth: 2,
  borderColor: theme.colors.ui.border,  // Subtle 5% white
}
```

**Pro Badge (Purple):**

```typescript
{
  backgroundColor: 'rgba(192, 132, 252, 0.15)',  // 15% purple
  borderWidth: 1,
  borderColor: 'rgba(192, 132, 252, 0.3)',        // 30% purple
  borderRadius: theme.borderRadius.full,          // Pill shape
}
```

### Subscription Flow Architecture

**Screen Flow:**

1. Visual Hook (PremiumPreview - blurred CNS card)
2. Authority Hero ("UNLOCK PRO FEATURES")
3. Outcome Benefits (BenefitsRow - 3 icons)
4. Feature Value Stack (FeatureStack - 5 features)
5. Package Selector (weekly/monthly/yearly chooser)
6. Pricing Display (dynamic breakdown)
7. CTA Button ("UNLOCK PRO ACCESS")
8. Restore Purchases Link

**State Management:**

```typescript
const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

// Auto-select monthly on load
useEffect(() => {
  if (offering?.availablePackages && !selectedPackage) {
    const monthlyPkg = offering.availablePackages.find(
      (pkg) => pkg.identifier === '$rc_monthly' || pkg.identifier.toLowerCase().includes('month')
    );
    setSelectedPackage(monthlyPkg || offering.availablePackages[0]);
  }
}, [offering, selectedPackage]);
```

**Purchase Flow:**

```typescript
// 1. Validate package exists
if (!selectedPackage) {
  Alert.alert('Error', 'No subscription packages available.');
  return;
}

// 2. Show loading state
setIsLoading(true);

// 3. Attempt purchase
const customerInfo = await purchaseMutation.mutateAsync(selectedPackage);

// 4. Handle success
if (customerInfo) {
  Alert.alert('WELCOME TO PRO!', 'You now have access to all premium features.');
  router.back();
}

// 5. Handle cancellation (customerInfo is null)
// No alert needed - user intentionally cancelled

// 6. Handle errors with user-friendly messages
catch (error) {
  const message = isStoreNotConfiguredError(error)
    ? "Purchases aren't available in this build..."
    : getErrorMessage(error);
  Alert.alert('Purchase Failed', message);
}
```

### Color Usage - Purple (Subscription/Pro)

**Primary Purple (Rest/Pro color):**

- Brand color: `#a855f7` (purple-500)
- Usage: Pro badges, subscription accents, selected states

**Purple Variations:**

- Light tint: `#c084fc` (purple-400) - borders, icons
- Background: `rgba(168, 85, 247, 0.15)` (15% opacity)
- Border: `rgba(168, 85, 247, 0.3)` (30% opacity)
- Selected BG: `rgba(192, 132, 252, 0.08)` (8% opacity)

**Gradient (CTA buttons):**

```typescript
colors: ['#a855f7', '#9333ea']; // purple-500 → purple-600
```

### Typography - Subscription Specific

**Package Labels:**

```typescript
fontSize: 10;
fontWeight: '800';
textTransform: 'uppercase';
letterSpacing: 1.2;
color: theme.colors.text.tertiary;
```

**Package Prices:**

```typescript
fontSize: 32;
fontWeight: '900';
fontStyle: 'italic';
letterSpacing: -1;
fontVariant: ['tabular-nums']; // CRITICAL for alignment
color: theme.colors.text.primary;
```

**Savings Badge:**

```typescript
fontSize: 9;
fontWeight: '900';
textTransform: 'uppercase';
letterSpacing: 0.5;
color: theme.colors.background; // Black on orange
```

### Documentation

See `REVENUECAT_FEATURES.md` for:

- Complete feature list
- Usage examples
- Package helper utilities
- Error handling
- Testing guide
- Troubleshooting

---

**Last Updated**: 2026-02-15
