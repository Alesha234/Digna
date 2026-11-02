# Digna

**Your money's good here.**

Live: **[digna.dev](https://digna.dev)** · Built for the Meta Global AI Developer Hackathon (startup track) · Practice money only

---

## Why Digna exists

I stood at a hotel front desk with money in my account and watched my card get declined. The hotel wanted a card that could hold a deposit, and mine was the wrong kind. Nobody told me why.

That happens every day to people who pay with Cash App, Chime, debit and prepaid cards. Hotels, car rentals and cloud services turn those cards away, usually without a reason, often in public. It isn't about whether the money is there. It's about which cards a place trusts.

**Digna gives you a card for each of those places**, paid from your own money, with a limit you choose. No credit check, no debt. And if a place ever says no, Digna tells you exactly why, in plain words, and what to do next.

## Why Digna is different

Most money apps stop at holding your money. Digna is built for the moment that matters: when you're at the counter.

| Most money apps | Digna |
| --- | --- |
| One card for everything | A card for each place, each with its own limit |
| "Declined." Nothing else. | Every no comes with the reason, and what to do next |
| Bills are yours to keep track of | Snap a bill and Digna reads it and sets up its card |
| Help means waiting on hold | Ask Digna anything, in your own words, any time |
| One leaked card number puts everything at risk | Close one card; the rest keep working |

*Built from one declined card at a hotel desk, for everyone who's ever felt that moment, and for a future where your money is welcome everywhere.*

## What you can do today

Everything below works on [digna.dev](https://digna.dev) with a free account (or a sample account, no sign-up needed). It all uses **practice money**: no real money moves, and the site says so on every page.

- **Make an account.** Start with $250 in practice money. Your password goes straight to the sign-in service, which keeps only a scrambled version of it, and only you can see your cards, bills and history.
- **Make a card for each place,** each with its own limit and end date. Pause it, raise its limit, or close it in one tap. It can never spend past its limit.
- **Pay a bill.** Upload a bill or invoice (a screenshot, a photo, a PDF or a Word file). Meta's Muse Spark reads who it's from, the amount and the due date, and keeps it in Your bills. Make a card just for it, then pay it at its own checkout.
- **See what a checkout really says.** Sample businesses follow real-world rules: a cloud service that takes credit cards only, a hotel that turns away prepaid cards for its check-in hold. Pay with an everyday card, then with a Digna card, and see each answer and why.
- **The Digna moment.** Every payment ends with its own short scene: an approval has a chime, a burst of light and "Your money's good here." A decline is soft and private: no buzzer, no red, just the reason.
- **Ask Digna.** A money assistant one tap away on every screen, which explains any decline using your own cards and payments.
- **Receipts** for every approved payment, as PDFs.

## Meta's AI inside Digna

Digna uses Meta's models only, through Meta's Model API.

| Model | What it does in Digna |
| --- | --- |
| **Muse Spark** | The money assistant, and reading bills and invoices (photos as pictures; PDFs and Word files as their words) |
| **Muse Image** | Every picture on the site. The people in them are invented, drawn to show many backgrounds, ages and abilities |

## How it's built

- **App:** Next.js 16 and React 19, hosted on Northflank at digna.dev.
- **Accounts and data:** Supabase (Postgres, Auth and private file storage). Every table has row-level security: people only ever read their own rows.
- **Money stays the server's job.** Balances, limits and payments change only inside database functions (`checkout_pay`, `pay_bill`, `sandbox_pay`), which check the card, its expiry and code, the place's rules, the card's limit and the wallet. A bill can be marked paid only by a payment that went through.
- **AI calls stay on the server.** The Meta key lives only in the host's settings (`META_API_KEY`). Each person has a daily limit of AI answers, and so does the whole site, to keep costs predictable.
- **Files in the browser.** PDFs and Word files are read in the browser with its own tools (no extra packages), then only their words are sent to Muse Spark. Uploaded bills are stored in each person's own private folder.
- **Sound with no files.** The Digna chime is made by the browser itself, plays only after you press Pay, and can be turned off.

## Run it yourself

1. `npm install`
2. Create a Supabase project and run the files in `src/modules/database/migrations/` in order (`0001` to `0019`) in its SQL Editor. Each file is safe to run more than once.
3. Set these on your host or in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `META_API_KEY` (and optionally `AI_SITE_DAILY_LIMIT`).
4. `npm run dev`

## Honest notes

- **Practice money only.** Digna is not a bank and doesn't issue real cards yet. Real cards would come through a licensed card partner; the site will say so clearly when that's true.
- **The sample businesses and deals are invented** examples, labelled as such.
- **Built during the hackathon.** Every commit in this repository is from Oct 30 to Nov 4, 2026.

## How Digna was built

Digna was built in **Ignesis**, an AI studio I'm building: you describe an app in plain words, a team of AI agents plans it, and Meta's Muse Code builds the changes you approve, with every change checked before you see it. Ignesis is a separate project I started before the hackathon and isn't part of this submission. More on it soon.
