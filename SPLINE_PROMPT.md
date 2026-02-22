# Spline AI Scene Prompt — Han Signal Bars

Use this prompt in Spline's AI scene generator (spline.design → New Scene → AI Generate).

---

## Prompt

```
Create a dark, premium 3D scene for an AI tech product called "Han".

Central element: Three vertical signal bars (like a WiFi/cellular signal icon) standing tall in the center of the scene. Each bar is a rounded rectangle — left bar is shortest, middle bar is medium height, right bar is tallest. The bars should be slightly spaced apart, hovering above a reflective dark surface.

Materials:
- Bars: Glowing neon sky blue (#0EA5E9) with a subtle cyan gradient (#06B6D4) from bottom to top. Emissive glow effect on all three bars.
- Background: Very deep dark navy (#050A14), almost black. No visible floor grid — just deep space atmosphere.
- Subtle ambient particles: small floating white dots drifting slowly upward, like dust in light.

Lighting:
- One directional light from top-left at low intensity (white)
- Point light centered below the bars, sky blue color, intensity medium — creates upward bloom on the bars
- No harsh shadows

Animation (loop, 3 seconds):
- The three bars pulse in sequence like a sound wave or signal animation:
  - Left bar: scale Y from 0.4 to 1.0 and back
  - Middle bar: scale Y from 0.6 to 1.0 and back, offset 200ms
  - Right bar: scale Y from 0.8 to 1.0 and back, offset 400ms
- Subtle slow rotation of the whole scene: rotate Y axis -8° to +8° back and forth over 6 seconds (breathing rotation)
- Floating particles drift upward slowly and fade out

Camera: Slight low angle (looking up at the bars at about 15°), centered. No perspective distortion. Clean product shot framing.

Overall vibe: Premium SaaS product, dark mode, AI-powered, Nigerian tech startup energy. Clean like Vercel, glowing like a signal tower at night.
```

---

## After generating in Spline

1. Preview it in your browser at spline.design
2. Click **Export → Web (Public link)** in the top-right
3. Copy the URL that looks like: `https://prod.spline.design/XXXXXXXXXX/scene.splinecode`
4. Open `apps/web/src/components/landing/Hero.tsx`
5. Find this line at the top:
   ```ts
   const SPLINE_SCENE_URL = "";
   ```
6. Replace it with your URL:
   ```ts
   const SPLINE_SCENE_URL = "https://prod.spline.design/XXXXXXXXXX/scene.splinecode";
   ```
7. The 3D scene will replace the animated placeholder bars in your hero section automatically.

---

## Tips

- If the AI generation doesn't match exactly, you can manually adjust:
  - Select a bar → Properties → Transform → Y Scale for sizing
  - Select all bars → right-click → Group → add a "Rotate" state for the breathing animation
  - Add a Point Light from the left panel → set color to #0EA5E9
- The scene loads asynchronously so the page won't block — the animated bars placeholder shows while it loads
- For best performance keep the scene under 150k polygons (Spline's AI scenes are usually well under this)
