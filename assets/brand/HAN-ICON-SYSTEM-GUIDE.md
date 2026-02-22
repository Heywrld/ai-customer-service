# Han - Icon-Only Design System

## 🎯 Icon System Overview

**Brand Mark:** Three ascending signal bars  
**Meaning:** Always available, constant communication, growing signal strength  
**Style:** Minimal, modern, geometric  

---

## 📁 Complete Icon Library

### Core Icons

1. **han-icon-primary.svg** (200×200)
   - Primary brand icon with gradient
   - Use for most applications
   - Transparent background

2. **han-icon-mono.svg** (200×200)
   - Single color (slate)
   - For monochrome printing, embroidery
   - Transparent background

3. **han-icon-dark.svg** (200×200)
   - Brighter gradient for dark backgrounds
   - Dark background included
   - Use in dark mode UI

4. **han-icon-white.svg** (200×200)
   - Pure white version
   - For use on colored backgrounds
   - Transparent background

---

### Specialized Formats

5. **han-favicon-only.svg** (32×32)
   - Ultra simplified for browser tabs
   - Optimized for 16px, 32px display
   - Gradient preserved

6. **han-app-icon-1024.svg** (1024×1024)
   - iOS/Android app icon
   - 20% padding margin
   - White background with rounded corners

7. **han-social-avatar.svg** (800×800)
   - Twitter, LinkedIn, Facebook profile
   - Subtle gradient background
   - Optimized for circular crop

8. **han-icon-circle.svg** (200×200)
   - Circular background variant
   - For badges, avatars
   - White background

9. **han-icon-rounded-bg.svg** (200×200)
   - Rounded square with gradient background
   - For app launchers, widgets

10. **han-icon-animated.svg** (200×200)
    - Pulsing animation
    - For loading states, active indicators
    - Web use only

---

## 🎨 Color Specifications

### Primary Gradient
```css
background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);

/* Individual colors */
--sky-500: #0EA5E9;
--cyan-500: #06B6D4;
```

### Dark Mode Gradient (Brighter)
```css
background: linear-gradient(135deg, #38BDF8 0%, #22D3EE 100%);

/* Individual colors */
--sky-400: #38BDF8;
--cyan-400: #22D3EE;
```

### Monochrome
```css
--slate-900: #0F172A;
```

### White
```css
--white: #FFFFFF;
```

---

## 📐 Icon Specifications

### Dimensions
- **Base icon:** 200×200px
- **Bars:** 24px wide each
- **Spacing:** 4px between bars
- **Corner radius:** 6px (30% of width)
- **Heights:** 40px, 60px, 80px (ascending)

### Proportions
```
Bar 1: 24×40px (shortest)
Bar 2: 24×60px (medium)
Bar 3: 24×80px (tallest)

Total width: 80px (24 + 4 + 24 + 4 + 24)
Total height: 80px (tallest bar)

Positioned in center with 60px margin on all sides
```

---

## 📏 Minimum Sizes

### Digital
- **UI elements:** 24px minimum
- **Navigation:** 32px recommended
- **Hero sections:** 80px+
- **Favicon:** 16px (use simplified version)

### Print
- **Business cards:** 0.5 inch
- **Letterhead:** 0.75 inch
- **Marketing materials:** 1 inch+

---

## ✅ Usage Guidelines

### Use Primary Icon When:
✅ On white or light backgrounds  
✅ In full color applications  
✅ As main brand identifier  
✅ In marketing materials  

### Use Monochrome Icon When:
✅ Single-color printing  
✅ Embroidery or engraving  
✅ Fax/stamps  
✅ Minimalist applications  

### Use Dark Icon When:
✅ On dark backgrounds (#0F172A, #1E293B)  
✅ In dark mode UI  
✅ On video overlays  
✅ In presentations with dark slides  

### Use White Icon When:
✅ On colored backgrounds  
✅ On photographs  
✅ On brand gradient backgrounds  
✅ In reverse applications  

### Use Animated Icon When:
✅ Loading indicators  
✅ "Processing" states  
✅ Active conversation indicator  
✅ Web only (not in print/static)  

---

## 🎯 Application Examples

### Website Header
```html
<!-- Light mode -->
<img src="/han-icon-primary.svg" alt="Han" class="h-8 w-8">

<!-- Dark mode -->
<img src="/han-icon-dark.svg" alt="Han" class="h-8 w-8">
```

### Favicon
```html
<link rel="icon" type="image/svg+xml" href="/han-favicon-only.svg">
```

### App Icon (Multiple Sizes)
```
iOS:
- 1024×1024 (App Store)
- 180×180 (iPhone)
- 167×167 (iPad Pro)
- 152×152 (iPad)

Android:
- 512×512 (Play Store)
- 192×192 (xxxhdpi)
- 144×144 (xxhdpi)
- 96×96 (xhdpi)

Export from han-app-icon-1024.svg
```

### Social Media Profiles
```
Twitter: 400×400 (circular crop from han-social-avatar.svg)
LinkedIn: 400×400 (from han-social-avatar.svg)
Facebook: 180×180 (from han-social-avatar.svg)
Instagram: 320×320 (from han-social-avatar.svg)
```

### Loading State
```html
<!-- Animated icon for loading -->
<img src="/han-icon-animated.svg" alt="Loading..." class="h-12 w-12">
```

---

## 🎨 Background Pairing

### Recommended Backgrounds

**For Primary Icon (blue gradient):**
```css
✅ White: #FFFFFF
✅ Light gray: #F8FAFC, #F1F5F9
✅ Light blue: #F0F9FF, #E0F2FE
❌ Dark colors (use dark icon instead)
```

**For Dark Icon (bright gradient):**
```css
✅ Dark slate: #0F172A, #1E293B
✅ Black: #000000
✅ Dark blue: #0C4A6E, #075985
❌ Light colors (use primary icon instead)
```

**For White Icon:**
```css
✅ Brand gradient: linear-gradient(135deg, #0EA5E9, #06B6D4)
✅ Any solid color
✅ Photographs with 40%+ opacity overlay
✅ Colored backgrounds (#10B981, #8B5CF6, etc.)
```

**For Monochrome Icon:**
```css
✅ Any background with 4.5:1+ contrast ratio
✅ Prints well on any color
```

---

## 📐 Clear Space

Maintain minimum clear space around icon equal to **one bar width** (24px at base size).

```
    [24px]
[24px] ICON [24px]
    [24px]
```

**At different sizes:**
- 24px icon = 3px clear space
- 32px icon = 4px clear space
- 64px icon = 8px clear space
- 128px icon = 16px clear space

---

## ❌ Don'ts

### NEVER:
❌ Rotate the icon (bars must be vertical)  
❌ Rearrange bars (must be ascending left to right)  
❌ Change bar proportions  
❌ Use different gradients (except approved variants)  
❌ Add effects (drop shadows, 3D, etc.)  
❌ Place on busy backgrounds without overlay  
❌ Stretch or distort  
❌ Change corner radius  
❌ Separate bars  
❌ Outline or stroke  
❌ Change opacity (except animated version)  

---

## 🎨 Icon Variations for Specific Uses

### Email Signature
```
Size: 24×24px
File: han-icon-primary.svg
Background: White or transparent
```

### Loading Spinner
```
Size: 48×48px
File: han-icon-animated.svg
Background: Transparent
Context: "Processing your request..."
```

### Push Notification Icon
```
Size: 64×64px
File: han-app-icon-1024.svg (exported as PNG)
Background: White with rounded corners
```

### Chat Bubble Avatar
```
Size: 32×32px
File: han-icon-circle.svg
Background: White (circular)
```

### Status Indicator
```
Size: 16×16px
File: han-favicon-only.svg
Usage: Show "online/active" status
Can pulse using animated version
```

---

## 📱 Platform-Specific Exports

### iOS App Icon
```bash
# Export from han-app-icon-1024.svg

Required sizes (PNG):
- 1024×1024 (App Store)
- 180×180 (iPhone 3x)
- 120×120 (iPhone 2x)
- 167×167 (iPad Pro)
- 152×152 (iPad 2x)
- 76×76 (iPad 1x)

Note: iOS adds rounded corners automatically
```

### Android App Icon
```bash
# Export from han-app-icon-1024.svg

Required sizes (PNG):
- 512×512 (Play Store)
- 192×192 (xxxhdpi)
- 144×144 (xxhdpi)
- 96×96 (xhdpi)
- 72×72 (hdpi)
- 48×48 (mdpi)

Also need adaptive icon:
- Foreground layer (icon only, transparent)
- Background layer (white or gradient)
```

### PWA Icons
```json
{
  "icons": [
    {
      "src": "/han-icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/han-icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Favicon (Multi-size ICO)
```html
<!-- Modern browsers (SVG) -->
<link rel="icon" type="image/svg+xml" href="/han-favicon-only.svg">

<!-- Fallback (PNG) -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```

---

## 🎯 Quick Reference

```
PRIMARY USE:        han-icon-primary.svg
DARK MODE:          han-icon-dark.svg
MONOCHROME:         han-icon-mono.svg
FAVICON:            han-favicon-only.svg
APP ICON:           han-app-icon-1024.svg
SOCIAL:             han-social-avatar.svg
LOADING:            han-icon-animated.svg
ON COLORED BG:      han-icon-white.svg
CIRCULAR AVATAR:    han-icon-circle.svg
WITH BACKGROUND:    han-icon-rounded-bg.svg
```

---

## 📊 Export Settings

### For Web (SVG)
- Optimize for web
- Remove unnecessary metadata
- Embed gradients (don't link)
- viewBox attribute required

### For Print (PDF/EPS)
- CMYK color mode
- Embed fonts (if any)
- Outline strokes
- 300 DPI minimum

### For Raster (PNG)
- 72 DPI (screen)
- 300 DPI (print)
- Transparent background (unless specified)
- sRGB color space

---

**Icon System v1.0**  
**Last Updated:** February 2026  
**File Format:** SVG (primary), PNG (fallback)  
**Color Mode:** RGB (screen), CMYK (print)
