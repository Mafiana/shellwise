# Shellwise (React + Supabase + Paystack)

The public site (landing, plans, about, privacy/terms, sign up / log in, billing) is React. The practice lab
(terminal, modules, quizzes, games) is the original code, unchanged, in `public/lab/` and shown full-screen at `/lab`.
This is stage 1 of the migration; see "Next stages" at the end.

## 1. Run it (no accounts needed)
    npm install
    npm run dev
With no `.env`, sign-up and login use a browser-only demo (fine for looking around, not real security).

## 2. Connect Supabase (real accounts)
1. Create a project at supabase.com.
2. SQL Editor: paste `supabase/schema.sql` and run it. Edit the plan prices at the bottom first (they are in **kobo**: ₦2,500 = 250000).
3. Authentication > URL Configuration: set Site URL to your site address and add `https://YOUR-SITE/auth` to Redirect URLs.
4. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project Settings > API; the anon key is public by design). Never put the service-role key in `.env`.

## 3. Connect Paystack
1. Paystack dashboard > Settings > API Keys: start with the **test** secret key.
2. Deploy the functions (Supabase CLI):

       supabase link --project-ref YOUR_REF
       supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxx SITE_URL=https://YOUR-SITE
       supabase functions deploy paystack-init
       supabase functions deploy paystack-verify
       supabase functions deploy paystack-webhook --no-verify-jwt

3. Paystack dashboard > Settings > API Keys & Webhooks: set the webhook URL to
   `https://YOUR_REF.supabase.co/functions/v1/paystack-webhook`.
4. Set `VITE_PAYMENTS=on` in `.env`, rebuild, and pay with a Paystack test card.
5. Auto-renewing subscriptions (optional): create plans in the Paystack dashboard, then put each `PLN_xxx` code in the
   `plans` table (`paystack_monthly_code`, `paystack_yearly_code`). Without a code, each payment is a one-off period.
6. Going live: swap to the live secret key (`supabase secrets set ...`), confirm the live webhook URL, make one small real payment.

## How payments stay safe
- The browser never sends a price. `paystack-init` reads it from the `plans` table.
- Plans change only inside the functions (service role). Users cannot update their own `plan` (column-level grants + RLS).
- The webhook checks Paystack's HMAC signature, re-verifies the transaction with Paystack, and compares the amount. Replays are harmless (unique `payments.reference`).
- Card details are entered on Paystack, never on this site.

## 4. Deploy
`npm run build` then upload `dist/` to Netlify, Vercel or Cloudflare Pages. The included `public/_redirects` / `vercel.json`
send every route to `index.html`. The production build adds a Content-Security-Policy.

## Before launch, replace
LinkedIn URL and WhatsApp link (`src/data/site.js`), `public/assets/founder.jpg` (founder photo, already set), testimonials
(`src/data/testimonials.js`), plan prices (`src/data/plans.js` AND the `plans` table), and have the legal text reviewed.

## Not tested against live services
Supabase and Paystack code was written to their documented APIs but was not run against a real project or Paystack account.
Test the full flow with test keys before real money.

## Progress sync (built)
Learner and Pro accounts copy lab progress (`kstate`, `kdone`, `kdaily`, `kexam`, `kcert`, `kctf`, `kpath`) to `profiles.progress` every 15 s and on leaving, and
pull it before the lab opens (the further-along copy wins). Free and guest progress stays on the device. Untested live.

## Plan limits and profile photo (built)
- Prices: Learner N1,300, Pro N2,800 per month (there are three plans: Free, Learner, Pro) (yearly: Learner N1,100 and Pro N2,400 per month, billed as 12 months at once). They live in `src/data/plans.js` AND the `plans` table
  (`supabase/schema.sql`, in kobo). Change both together.
- What each plan opens is one table: `LIMITS` at the top of `public/lab/access.js`
  (Free: 10 modules, 2 topic quizzes, 6 games. Learner: 35 / 8 / 20 plus certificate and daily challenge. Pro: everything, plus timed exams, missions and learning paths).
  Module quizzes follow the module limit. Locked cards show "Unlock", and opening one shows a "Choose a plan" prompt that sends the user to the plans section.
  Change the numbers there and the plan card text in `src/data/plans.js`.
- IMPORTANT: this lock runs in the browser, so a determined user could bypass it with developer tools. It is fine as a product gate.
  To enforce it for real, move locked content behind a Supabase table/Edge Function that checks `profiles.plan`.
- Profile photo: signed-in users upload a photo on the profile page. It is cropped to 256x256 JPEG in the browser and saved to
  `profiles.avatar` (Supabase) or this browser (demo mode). If you already ran an older schema.sql, run the two `alter`/`grant` lines at the top of the new one.
- To try a paid plan in demo mode: after signing in, run in the browser console
  `u=JSON.parse(localStorage.kuser);u.plan='pro';localStorage.kuser=JSON.stringify(u)` then reload the lab.
  (With Supabase on, the plan changes only after a verified Paystack payment.)

## Certificate, daily challenge, timed exam (built)
Sidebar items in the lab, added by `public/lab/extras.js`:
- **Certificate** (Pro only): the Download button stays locked (padlock) until every module, every quiz (70%+), every game (won once) and every mission is done. The page shows a checklist of what is left. Shows the user's name,
  date, a certificate ID and the founder's name. Download as PNG or print/save as PDF. It says plainly that it is practice-lab coursework,
  not an industry certification. The ID is a fingerprint of name and date, not a verifiable record; for verifiable certificates add a `certificates`
  table and a public check page.
- **Daily challenge and streaks** (Learner and up): 5 questions a day, same set for everyone, XP bonus that grows with the streak, 28-day calendar.
- **Timed exam mode** (Pro and up): 15, 30 or 50 questions with a countdown, flagging, no feedback until submit, 70% pass mark, auto-submit when time ends, review of misses and attempt history.
These save in the browser (`kdaily`, `kexam`, `kcert`) and sync for paid accounts with the rest of the progress.
Gates live in `FEAT` in `public/lab/access.js`.

## Missions, learning paths and placement test (Pro)
Sidebar items `Missions` and `Paths`, from `public/lab/pro.js`; the content is in `public/lab/pro-data.js`.
- **Missions**: 3 CTF packs (Terminal Warm-up, Web and Network Defender, SOC Analyst Lab), 15 challenges. Flags look like `SW{...}`.
  Hints cost 25% of the XP reward each. Flags are stored as SHA-256 hashes so they are not readable in the page source, but a determined
  user can still brute-force or inspect the code, so treat this as practice, not a competition. Saved in `kctf`.
- **Learning paths**: 5 paths (a fixed order of existing modules) with progress and a 100 XP bonus when all modules are done. Saved in `kpath`.
- **Placement test**: 12 questions across basics, intermediate and security. It recommends a path.
To add challenges or paths, edit `pro-data.js` (flags are compared as `sha256(lowercase flag)`).

## Existing database? Run these
If you created the database with an older `schema.sql` (it still had the Team plan and old prices), run `supabase/upgrade-plans.sql` once.
Team accounts are moved to Pro.

## Admin panel
Open `/admin` while signed in as an admin. It shows who is online (seen in the last 2 minutes), user list with search and filters,
plan changes, suspend/restore, payments, contact messages, signups and revenue.
1. In Supabase > SQL Editor run `supabase/admin.sql` (after `schema.sql`).
2. Make yourself admin (replace the email): `update public.profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com');`
3. Deploy the action function: `supabase functions deploy admin-action`
4. Sign in with that account. An "Admin" link appears in the menu.
How it is protected: the admin flag lives in `profiles.is_admin`, which users cannot change (column-level grants). Reading everyone's data needs
`is_admin()` in the database policies, and plan changes/suspensions run in `admin-action`, which re-checks the flag on the server every time.
"Online" comes from a heartbeat (`touch_seen`) the app sends about once a minute while the site is open. A suspended user is signed out the next time
the app loads their profile (this check is in the browser, so the database itself still lets a suspended user's session read their own row until it expires).
It needs the real backend and was not run against a live Supabase project. Add a line about this to your privacy policy if you change what you track (the shipped text already mentions it).

## Delete account (Settings > Danger Zone)
Signed-in users see a red **Delete Account** button at the bottom of Settings. They must type DELETE. The lab asks the React app, which calls
the `delete-account` Edge Function (`supabase functions deploy delete-account`). The function takes the user id from the verified token (a user can
only delete themselves), removes the auth user (this cascades to `profiles`, `payments` and `subscriptions`) and deletes contact messages sent from the same email.
The person then disappears from the admin panel on its next refresh. Admin accounts are refused (remove the flag first).
Without Supabase (demo mode) it removes the account from this browser. It does NOT cancel a recurring Paystack subscription; if you use
auto-renewing plan codes, cancel those in the Paystack dashboard or add that call to the function. Not run against a live project.

## Contact form
The Contact section saves messages to the `contact_messages` table (included in `schema.sql`; anyone can insert, nobody can read from the site).
Read them in the admin panel (Messages) or in Supabase > Table Editor. Without Supabase it runs in preview mode and says nothing was sent.

## Next stages
1. (done, see above)
2. Port the lab views (modules, quizzes, games) into React and remove the iframe.
3. Enforce paid features (e.g. gating) from `profiles.plan`.


## Setup guide
See `SETUP.md` for the full Supabase + Paystack steps (one SQL file: `supabase/setup-all.sql`, email code/link verification, unique usernames, Edit profile columns).
