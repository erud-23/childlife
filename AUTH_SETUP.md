# Passwordless email sign-in setup

Child Life Study Lab uses Supabase Auth for passwordless email sign-in. A user enters an email address, receives a six-digit code, and enters the code to sign in. A first-time email address is automatically registered by Supabase.

## 1. Create a Supabase project

1. Create a project in the Supabase dashboard: https://supabase.com/dashboard
2. In Project Settings / API, copy the project URL and the browser-safe publishable key (or legacy anon key).
3. Open `auth-config.js` in this repository and set:
   - `url` to the project URL, such as `https://YOUR-PROJECT-REF.supabase.co`
   - `anonKey` to the publishable/anon key.

These two values are designed to be used in a public browser app. **Never put a service_role key or any secret key in this repository.**

## 2. Configure email OTP

In the Supabase dashboard:

1. Open **Authentication → Email Templates** and edit the Magic Link / OTP template.
2. Make the email include the OTP token variable `{{ .Token }}`, for example:

   ```html
   <h2>Your Child Life Study Lab sign-in code</h2>
   <p>Enter this six-digit code to sign in:</p>
   <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px">{{ .Token }}</p>
   <p>If you did not request this code, you can ignore this email.</p>
   ```

3. Ensure the email provider is configured to send OTP codes. Supabase's default email service has restrictive delivery/rate limits; configure a trusted custom SMTP provider before opening the site to the public.
4. In **Authentication → URL Configuration**, set the Site URL to:
   `https://erud-23.github.io/childlife/`
   Add that same URL as an allowed redirect URL if the dashboard requires it for your project configuration.
5. Check the email OTP expiry and rate limits. Use a short expiry appropriate for sign-in and do not disable provider protections.

## 3. Test the live site

1. Commit the values in `auth-config.js` to `main` (the URL and publishable/anon key are public browser configuration, not secrets).
2. Wait for GitHub Pages to deploy, then open https://erud-23.github.io/childlife/.
3. Choose **Sign in / Create account** in the top-right navigation. This opens the dedicated `account.html` page.
4. Enter an email address you control and choose **Email me a sign-in code**.
5. Check the inbox/spam folder, enter the six-digit code, and choose **Verify code & sign in**.
6. After verification, use **Continue to Study Lab**. Sign out and test again with a fresh code if needed.

The interface intentionally remains inactive until the Supabase URL and key are configured.

## Current scope and security notes

- This is passwordless email OTP authentication; the emailed code is the sign-in factor. It is not multi-factor authentication (MFA), because it does not require a second independent factor.
- Supabase manages user identities, OTP issuance/expiry, and session tokens. The browser never creates or verifies codes itself.
- Keep the publishable/anon key public, but never expose a service_role/secret key.
- Configure rate limits and, for a public launch, consider CAPTCHA/bot protection in Supabase Auth.
- **Study progress is still stored locally in each browser.** Signing in does not yet sync progress between devices or protect the question bank behind an authenticated API. The current question bank is still delivered to the browser, so this login feature by itself does not prevent copying it.


## Where the files live

The redesigned site keeps the study dashboard in `index.html`, shared presentation in `styles.css`, study behavior in `app.js`, and question content in `question-bank.js`. Email sign-in has its own `account.html` page and `auth.js` script. The top-right **Sign in / Create account** link opens the dedicated account page rather than embedding the form in the dashboard.
