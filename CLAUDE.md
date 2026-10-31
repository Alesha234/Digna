# Digna (this repository)

Rules from the owner for any work on Digna:

- **AI inside Digna uses Meta's models only** (today: Muse Spark for the money assistant and bill reading, Muse
  Image for the site's pictures, through Meta's Model API with the owner's `META_API_KEY`). Don't add another AI
  provider to the product. If a feature can't be done with a Meta model, say so instead of switching providers,
  and keep the website's claims about Meta's AI true.
- **Plain, human words on every page.** No "sandbox", "test mode", "merchant" or "cap": say practice money, Try
  paying, place or business, limit. Explain *why* a card is declined, not just that it was.
- **It's practice money, and the site says so honestly.** It should feel real (typed card details, receipts,
  notifications), but never claim real cards, real acceptance or a bank until a licensed partner is live.
- Database changes go in `src/modules/database/migrations/` as re-runnable files; the owner runs them in the
  Supabase SQL Editor.
