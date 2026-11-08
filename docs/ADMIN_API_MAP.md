# Diganta News pages and API calls

The admin pages follow the flows in the local `bangladeshnewsday` project. They use Diganta News branding and React Router. All API calls send `X-Tenant-Slug: digontonews`. Protected calls also send a bearer access token.

## Admin pages

| Page | API calls |
| --- | --- |
| `/admin/login` | `POST /api/accounts/login/` |
| `/admin/signup` | `POST /api/accounts/staff/signup/` |
| `/admin/verify-otp` | `POST /api/accounts/verify-otp/` |
| `/admin`, `/admin/dashboard` | Redirect to `/admin/articles` |
| `/admin/articles` | `GET /api/news/editor/articles/?status=…`; article detail, submit, approve, reject, recall, and delete; RSS import and job status |
| `/admin/articles/new` | Categories list; `POST /api/news/articles/` with multipart image data; optional submit and approve |
| `/admin/articles/:slug/edit` | Article detail; categories list; `PATCH /api/news/articles/:slug/` with multipart data |
| `/admin/articles/pending` | Editor list with `status=PENDING`; article detail; approve and reject |
| `/admin/categories` | Categories list/create; category update/delete by slug |
| `/admin/users` | `GET/POST /api/accounts/users/`; `PATCH /api/accounts/users/:id/role/`; Owner only: `GET /api/accounts/users/pending/`, `POST /api/accounts/users/:id/approve/` |
| `/admin/ads` | `GET/POST /api/news/ads/`; ad update/delete by ID; image upload |
| `/admin/facebook` | Facebook connect URL; pages list/connect/update/disconnect; article list; photocard generation and Facebook publish |
| `/admin/analytics` | `GET /api/news/analytics/overview/` |
| `/admin/analytics/articles` | `GET /api/news/analytics/articles/` |
| `/admin/analytics/categories` | `GET /api/news/analytics/categories/` |
| `/admin/analytics/reporters` | `GET /api/news/analytics/reporters/` |
| `/admin/analytics/referrers` | `GET /api/news/analytics/referrers/` |

The session uses `dgn_access_token`, `dgn_refresh_token`, and `dgn_admin_session` in browser storage. An expired access token triggers `/api/accounts/token/refresh/`. Failed refresh clears the session and opens login. Logout clears these keys.

The owner and editor-in-chief can manage existing portal users. Only the Owner can see and approve staff requests. The backend checks both the role and portal. Reader accounts see an access message instead of the admin console.

Staff open `/admin/signup` on their portal. They enter email, password, and role: Editor or Reporter. The site sends its portal header automatically. The backend creates an inactive account with `is_pending_approval=true`. Staff see a pending message and can log in after approval. They do not use email codes for this flow. The existing reader signup and OTP APIs stay available.

The Owner sees pending requests and the full signup URL on `/admin/users`. Approval activates the account and removes the request. Other portals cannot list or approve these requests. Email codes cannot activate pending staff. Existing inactive accounts do not appear as staff requests.

Apply backend migration `accounts.0006_user_is_pending_approval` before using these pages. No new environment variables are needed.

Example signup body for `POST /api/accounts/staff/signup/`:

```json
{"email":"reporter@example.com","password":"ExamplePassword123!","role":"REPORTER"}
```

The response uses status `201` and contains a pending message. It contains no login tokens. Approval uses an authenticated `POST /api/accounts/users/:id/approve/` with no body. Its response contains the user with `is_active=true` and `is_pending_approval=false`.

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

Staff approval checks cover the three signup fields, a 390-pixel mobile view, the pending message, Owner approval, and list refresh. They also confirm that the Editor-in-Chief cannot see or fetch pending requests. Browser writes use test responses. Backend tests cover portal limits, role checks, login before and after approval, duplicate emails, and email-code bypass attempts.

Production verification on 7 November 2026: Vercel deployment `dpl_FpKkzvcUzXry1rV5tZMLdpW78zSL` reached READY and serves `https://digontonews.com`. Owner login succeeded on that domain. The live categories, users, ads, Facebook, and analytics pages opened. All 11 API tests, the TypeScript check, and the production build passed. Mobile checks used a 390-pixel viewport and found no page overflow.
