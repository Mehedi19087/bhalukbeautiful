# Browser verification

Checked with Playwright at 1440×1000 and 390×844:
- Home, category, article, today's paper, print edition, archive calendar, and search render.
- No horizontal overflow on those seven desktop/mobile layouts.
- No JavaScript page errors during the navigation and interaction pass.
- Category pagination increases displayed cards from 18 to 36.
- Print viewer opens, changes to page 2, and closes with Escape.
- Mobile menu exposes all 21 categories plus newspaper and archive links.
- Theme toggle changes the document theme.
- All bundled referenced image files have valid image signatures.
- `npm run build` succeeds.

Reference homepage, category, article, print, today's newspaper and calendar were inspected with direct Playwright screenshots. The reference search route returned a Cloudflare block page, saved in `docs/reference/search.png`; its exact visual layout could not be verified.

The implementation closely follows the captured newspaper layouts. It is not a pixel-identical copy: branding is replaced, third-party ad overlays are omitted, social profile URLs and editorial contact details need the owner's information, and search is a functional local layout. Some article fixtures contain only summaries. Date-dependent data needs the backend API.

## Diganta News brand update

Sampled the replacement source logo: cyan #27AAE2, gold #FCB040, ink #111111. Applied shared tokens across the site, replaced header/menu/footer logo and site title, and updated favicon. Kept the original logo pixels in a self-contained SVG crop because the generated enhancement candidate altered contours; the candidate is retained for review under docs/logo-review and is not used on the site. No claim of true vector reconstruction or recovered image detail.

Playwright checked all seven main page layouts at 1440px and 390px: no horizontal overflow or page errors. Confirmed badge fill #27AAE2, badge text/headlines #111111, and readable dark cyan navigation accents. Reviewed desktop, mobile, and dark-mode screenshots. Production build passes.

## Transparent logo update

Replaced the background-bearing crop with an RGBA PNG cutout in header, footer, menu, and favicon. Canvas inspection confirms 1,030,038 fully transparent pixels and zero-alpha corners in the 1958×803 PNG. Removed the CSS white logo backing. Added a dark-mode display filter for dark lettering, preserving colored areas and source alpha. Reviewed desktop, mobile, menu, and dark-mode screenshots. Mobile has no horizontal overflow; production build passes. Original input remains preserved.

## Vercel production deployment

Live URL: https://bhalukbeautiful.vercel.app

Deployment `dpl_J8jjhuyKQBZfSZdX9V8Gpvf2Udt4` reports READY in production. Playwright verified anonymous public access (HTTP 200), direct article and Bengali category URLs, category expansion from 18 to 36 stories, and the 24-link mobile menu. At 390px the homepage has no horizontal overflow. No JavaScript page errors occurred during this pass. Live desktop and mobile screenshots are stored alongside this report.
