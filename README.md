# Child Life Study Lab

A browser-based study companion for Child Life certification exam preparation. The site is a static GitHub Pages app; no build step is required.

## Site structure

- `index.html` — study dashboard and the Practice, Flashcards, Progress, quiz, and results views.
- `styles.css` — shared responsive styling, navigation, cards, form styles, and page layouts.
- `app.js` — quiz flow, question selection, adaptive review, flashcards, progress tracking, and progress import/export.
- `question-bank.js` — the question bank, kept separate from the page markup and application logic.
- `account.html` — dedicated sign-in/create-account page.
- `auth.js` — passwordless email-code authentication flow.
- `auth-config.js` — public Supabase project URL and publishable key used by the browser.
- `AUTH_SETUP.md` — setup notes for email authentication and delivery.

## Features

- Short timed practice sessions and a longer exam-style simulation.
- Topic-focused practice and flashcards.
- Explanations and review of completed questions.
- Adaptive review that prioritizes missed or not-yet-mastered questions.
- Progress summary with topic breakdown, export/import backup, and reset controls.
- Passwordless email-code sign-in through Supabase Auth.

## Run or preview locally

Because this is a static site, you can open `index.html` directly for most study features. For best results, use a local static server so relative files and the account page behave as they do on GitHub Pages. The site expects `styles.css`, `question-bank.js`, and `app.js` to be alongside `index.html`.

## Notes

- Study progress is currently stored in the browser's local storage. Signing in does **not** yet sync progress across devices.
- The Supabase publishable key is intended for browser use; never put a Supabase secret or service-role key in this repository.
- Email delivery and sign-in still depend on the Supabase email template, provider, and rate-limit settings described in `AUTH_SETUP.md`.
- This is an independent study aid and is not affiliated with or endorsed by the Association of Child Life Professionals. Verify current exam requirements using official ACLP resources.
