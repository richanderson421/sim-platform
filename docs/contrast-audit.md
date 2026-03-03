# Contrast Audit (2026-03-03)

## Scope reviewed
- Global text tokens and neutral surfaces (`globals.css`)
- Primary/secondary button readability
- Header navigation link contrast
- Page title/subtitle contrast in light and dark

## Issues found
1. Secondary action button could appear low-contrast on certain backgrounds.
2. Muted text in dark mode was too dim on dark surfaces.
3. Header nav links in dark mode could appear gray-on-near-black.

## Fixes applied
- Increased muted text contrast:
  - light `--muted-foreground`: `#334155`
  - dark `--muted-foreground`: `#cbd5e1`
- Increased dark card/surface separation:
  - dark `--card`: `#111827`
  - dark `--border`: `#334155`
- Reworked secondary button for stronger contrast:
  - light: bg `#eef2ff`, text `#312e81`, border `#a5b4fc`
  - dark: bg `#1e1b4b`, text `#e0e7ff`, border `#6366f1`
- Improved header nav link readability:
  - light text `text-slate-800`
  - dark text `text-slate-100` + clearer hover

## Result
- Better readability for page headers and admin/secondary actions
- Improved visibility in both light and dark themes
- No changes to backend/API behavior
