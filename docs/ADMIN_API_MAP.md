# Diganta News pages and API calls

The admin pages follow the flows in the local `bangladeshnewsday` project. They use Diganta News branding and React Router. All API calls send `X-Tenant-Slug: digontonews`. Protected calls also send a bearer access token.

## Admin pages

| Page | API calls |
| --- | --- |
| `/admin/login` | `POST /api/accounts/login/` |
| `/admin/signup` | `POST /api/accounts/signup/` |
| `/admin/verify-otp` | `POST /api/accounts/verify-otp/` |
| `/admin`, `/admin/dashboard` | Redirect to `/admin/articles` |
| `/admin/articles` | `GET /api/news/editor/articles/?status=…`; article detail, submit, approve, reject, recall, and delete; RSS import and job status |
| `/admin/articles/new` | Categories list; `POST /api/news/articles/` with multipart image data; optional submit and approve |
| `/admin/articles/:slug/edit` | Article detail; categories list; `PATCH /api/news/articles/:slug/` with multipart data |
| `/admin/articles/pending` | Editor list with `status=PENDING`; article detail; approve and reject |
| `/admin/categories` | Categories list/create; category update/delete by slug |
| `/admin/users` | `GET/POST /api/accounts/users/`; `PATCH /api/accounts/users/:id/role/` |
| `/admin/ads` | `GET/POST /api/news/ads/`; ad update/delete by ID; image upload |
| `/admin/facebook` | Facebook connect URL; pages list/connect/update/disconnect; article list; photocard generation and Facebook publish |
| `/admin/analytics` | `GET /api/news/analytics/overview/` |
| `/admin/analytics/articles` | `GET /api/news/analytics/articles/` |
| `/admin/analytics/categories` | `GET /api/news/analytics/categories/` |
| `/admin/analytics/reporters` | `GET /api/news/analytics/reporters/` |
| `/admin/analytics/referrers` | `GET /api/news/analytics/referrers/` |

The session uses `dgn_access_token`, `dgn_refresh_token`, and `dgn_admin_session` in browser storage. An expired access token triggers `/api/accounts/token/refresh/`. Failed refresh clears the session and opens login. Logout clears these keys.

The owner and editor-in-chief can manage portal users. The backend enforces permissions on all protected writes. Reader accounts see an access message instead of the admin console. Signup and OTP use the existing backend flows; signup does not grant admin rights. The current backend signup code does not assign a portal. Create portal editors and reporters from the owner's Users page so the backend assigns them to Diganta News.

Article creation explicitly sends `status=DRAFT`. Save Draft keeps that status. Submit sends the draft for review. Publish runs submit and approve. RSS import requires the admin to enter a count. No import starts on page load. Images use multipart requests. Summary and audio fields are generated backend output, not editable article fields.

## Public pages

| Page | API/data source |
| --- | --- |
| `/` | Published article list and categories; top banner ads |
| `/category/:slug` | Backend category slugs and published stories; sidebar ads |
| `/article/:slug` | Full article detail; view/referrer tracking; sidebar and in-article ads |
| `/search?q=…` | Search within the loaded published stories |
| `/newstoday`, `/archive?date=…` | Filter loaded stories by publication date in Bangladesh time |
| `/archive-calendar` | Links to the date filter |
| `/videos` | Published article video URLs |
| `/print` | Empty state; the backend has no print-edition API |

Public ad views and clicks call `/api/news/ads/:id/impression/` and `/api/news/ads/:id/click/`. Article views call `/api/news/articles/:slug/view/`.

No reference stories or print images appear as a fallback. Empty portals show an empty news page. Failed public requests show a retry action. Admin boot does not depend on the public dataset request.

## Validation

Run `npm test`, `npm run typecheck`, and `npm run build`.

Browser checks cover owner login, all admin list routes, category creation, draft creation, article editing, member creation, RSS count validation, and mobile layout. Writes use intercepted test responses. Live checks use login and read-only API requests; they do not generate or publish content.

Production verification on 7 November 2026: Vercel deployment `dpl_FpKkzvcUzXry1rV5tZMLdpW78zSL` reached READY and serves `https://digontonews.com`. Owner login succeeded on that domain. The live categories, users, ads, Facebook, and analytics pages opened. All 11 API tests, the TypeScript check, and the production build passed. Mobile checks used a 390-pixel viewport and found no page overflow.
