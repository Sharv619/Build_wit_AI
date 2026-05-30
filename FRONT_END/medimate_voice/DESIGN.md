---
name: Pilly
colors:
  surface: '#fbf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#fbf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ef'
  surface-container: '#efeeea'
  surface-container-high: '#eae8e4'
  surface-container-highest: '#e4e2de'
  on-surface: '#1b1c1a'
  on-surface-variant: '#434841'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f0ed'
  outline: '#737970'
  outline-variant: '#c3c8bf'
  surface-tint: '#4a6549'
  primary: '#4a6549'
  on-primary: '#ffffff'
  primary-container: '#8ba888'
  on-primary-container: '#243d24'
  inverse-primary: '#b0cfad'
  secondary: '#8b4e3d'
  on-secondary: '#ffffff'
  secondary-container: '#fdad98'
  on-secondary-container: '#783f2f'
  tertiary: '#7d525f'
  on-tertiary: '#ffffff'
  tertiary-container: '#c593a1'
  on-tertiary-container: '#512c38'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ccebc7'
  primary-fixed-dim: '#b0cfad'
  on-primary-fixed: '#07200b'
  on-primary-fixed-variant: '#334d33'
  secondary-fixed: '#ffdbd1'
  secondary-fixed-dim: '#ffb5a1'
  on-secondary-fixed: '#380d03'
  on-secondary-fixed-variant: '#6f3728'
  tertiary-fixed: '#ffd9e2'
  tertiary-fixed-dim: '#eeb8c7'
  on-tertiary-fixed: '#30111c'
  on-tertiary-fixed-variant: '#623b48'
  background: '#fbf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2de'
typography:
  display-lg:
    fontFamily: Quicksand
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-md:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  body-lg:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 36px
  body-md:
    fontFamily: Quicksand
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 32px
  label-lg:
    fontFamily: Quicksand
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  disclaimer:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  margin-mobile: 24px
  margin-tablet: 48px
  gutter: 16px
  stack-lg: 40px
  stack-md: 24px
  stack-sm: 12px
---

## Brand & Style
The design system is built on the philosophy of "Cozy Digital Living." It aims to evoke the warmth of a sunlit kitchen and the reliability of a trusted companion. The target audience includes seniors with varying degrees of visual or motor impairment and their caregivers. 

The aesthetic style is **Tactile & Soft**, blending organic shapes with a "human-first" approach. It avoids the clinical coldness of traditional health apps in favor of a comforting, approachable atmosphere. Every interaction is designed to feel patient, forgiving, and physically substantial, utilizing soft shadows and generous negative space to reduce cognitive load and prevent accidental inputs.

## Colors
This design system uses a palette inspired by natural, earthy tones to promote a sense of calm and safety.

*   **Base (#FDFBF7):** A creamy off-white used for all backgrounds to reduce screen glare and provide a soft canvas.
*   **Primary Sage (#8BA888):** Used for primary actions and "positive" states. For text appearing on this green, use the darker **Accent Safe (#4A5D48)** to ensure WCAG AA compliance.
*   **Terracotta Accent (#D68C78):** Used sparingly for secondary alerts, reminders, or specific health-related highlights.
*   **Text (#2D3436):** A deep charcoal, rather than pure black, to maintain high contrast while feeling softer on the eyes.

**Accessibility Note:** Dark mode is intentionally omitted to maintain a consistent high-contrast reading environment for users with cataracts or low light sensitivity.

## Typography
The typography utilizes **Quicksand**, a rounded sans-serif that mirrors the soft aesthetic of the brand. 

*   **Size & Legibility:** The base body text starts at 22px to accommodate age-related vision changes. 
*   **Weight:** Avoid "Light" weights. Medium (500) and SemiBold (600) are the standards for readability.
*   **Hierarchy:** Information is presented linearly. Headlines should be significantly larger than body text to clearly anchor sections of the screen.
*   **Disclaimer:** Medical disclaimers must be persistent, using the `disclaimer` style in a high-contrast dark tone against a slightly tinted version of the Creamy Base.

## Layout & Spacing
The layout follows a **Fixed-Width Column** model centered on the screen to prevent users from having to scan long lines of text, which can be disorienting.

*   **Rhythm:** A strict 8px grid ensures vertical consistency.
*   **Margins:** Large 24px side margins on mobile prevent thumb-overlap on content.
*   **Flow:** Use a single-column "stack" for most content. Elements should follow a clear top-to-bottom hierarchy to support "forward-only" navigation logic.
*   **Safe Areas:** Interactive elements must be separated by at least 16px (gutter) to prevent accidental taps.

## Elevation & Depth
Depth is used to suggest "press-ability." 

*   **Plinth Layers:** Cards and containers use a very soft, diffused shadow (15% opacity Primary Green) rather than a gray shadow, giving the UI a "warm glow" feel.
*   **Active Depth:** When a button is pressed, it should visually "sink" into the surface. 
*   **Low Contrast Outlines:** Use 2px soft-colored borders (#E6E2D3) to define card boundaries instead of harsh black lines. This maintains the "cosy kitchen" softness while providing structural definition.

## Shapes
Shapes are unapologetically friendly. 

*   **Corner Radius:** Standard components use a 16px (rounded-lg) radius. 
*   **Containers:** Larger screen sections or full-width cards use a 24px (rounded-xl) radius to feel like smooth, worn pebbles.
*   **No Sharp Edges:** To maintain the "human" feel, 0px radius corners are strictly forbidden in this design system.

## Components
Consistent, oversized components are the core of the user experience.

*   **Buttons:** Must be a minimum of 64px in height. Use the Primary Sage Green for the main action. Text must be bolded and centered.
*   **Icon + Label:** Icons must never stand alone. Every icon (min 32px size) must have a Label (Label-LG) placed directly beneath or to the right of it.
*   **Input Fields:** Use 2px borders with a 72px height. The placeholder text should be high-contrast and the same size as body text.
*   **Cards:** Use for health metrics or medication reminders. Cards should have a 24px internal padding and utilize the `rounded-xl` setting.
*   **Navigation:** A persistent "Back" button at the top-left and a large "Next/Continue" button at the bottom-right. Avoid complex hamburger menus; use a simple bottom-tab bar with labels if more than three destinations exist.
*   **Medical Disclaimer:** A persistent footer component with a subtle terracotta top-border, containing the mandatory legal health text in `disclaimer` font style.