# Connecting Shellwise to Supabase (and Paystack)

Nothing here has been run against your live project yet. Follow the steps in order and test each one.

## What uses the database
| Page / form | What it does in Supabase |
|---|---|
| Sign up | creates the user, sends the email code + link, creates the `profiles` row (username is UNIQUE) |
| Log in / forgot password | Supabase Auth |
| Username box | live check with `username_available()` |
| Contact page | inserts into `contact_messages` (read them in Table Editor) |
| Edit profile (name, location, bio, photo) | updates your own `profiles` row |
| Progress sync | `profiles.progress` |
| Plans / payment | Edge Functions `paystack-init`, `paystack-verify`, `paystack-webhook` write `payments` and `subscriptions`, and set `profiles.plan` |
| Admin panel | `admin_overview()` and Edge Function `admin-action` |
| Delete account | Edge Function `delete-account` |

## Steps
1. Create a project at supabase.com.
2. SQL Editor: paste `supabase/setup-all.sql` and run. (Already set up earlier? Run `supabase/upgrade-profile.sql` and `supabase/upgrade-plans.sql` instead.)
3. Make yourself admin: `update public.profiles set is_admin = true where email = 'you@example.com';`
4. Copy Project URL and anon key into `.env`:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   VITE_PAYMENTS=on
   ```
5. **Email verification (code + link):** Authentication > Providers > Email: turn ON "Confirm email". Authentication > Email Templates > "Confirm signup": include both
   `Your code: {{ .Token }}` and `<a href="{{ .ConfirmationURL }}">Confirm email</a>`.
   Authentication > URL Configuration: set Site URL to your site and add `https://YOUR-SITE/auth` to Redirect URLs.
   Supabase's built-in mailer is heavily rate limited: for real users add your own SMTP (Authentication > SMTP Settings, e.g. Resend or Brevo).
6. **Paystack:** `supabase secrets set PAYSTACK_SECRET_KEY=sk_live_...` (use `sk_test_` first), then
   `supabase functions deploy paystack-init paystack-verify paystack-webhook admin-action delete-account`.
   In the Paystack dashboard set the webhook URL to `https://<project>.functions.supabase.co/paystack-webhook` and the callback URL to `https://YOUR-SITE/billing/callback`.
7. Test: sign up with a real email, enter the code, pay with a Paystack test card, confirm you land in the lab on the new plan.

Prices: Learner N1,300 / month (N1,100 / month yearly), Pro N2,800 / month (N2,400 / month yearly). They live in `src/data/plans.js` and the `plans` table; the server charges the table value.
