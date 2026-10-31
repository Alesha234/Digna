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

# The Meta hackathon (the owner's entry; keep these in mind for every change)

- Meta Global AI Developer Hackathon, startup track (solo founder). Submissions due **Nov 4, 2026, 9:00 PM ET**.
- Rules: only work from Oct 26 to Nov 4 counts (disclose earlier work and where new work starts); a **public**
  GitHub repository that opens logged out; a **3-minute demo video showing only what was built during the event**;
  banned project types (AI medical/health advice, basic RAG, simple image analyzers, AI education chatbots, job
  screeners, nutrition/personality/sports coaches) don't apply here. Theme: "Build for Your World".
- Startup track is judged on technical execution and **whether it holds up in production**: the live site must work.
- Stage One screens submissions; Stage Two scores 0-10: **Impact 30%**, **Use of Meta AI tooling 25%** (creative,
  beyond a basic integration, capabilities that surprise Meta's own team), **Technical depth & execution 20%**
  (sound, refined, real craft), **Demo 25%** (works, impressive, holds up live, the video is genuinely cool). Stage
  Three: the top 5 per track are ranked by judges watching the videos live.
- The planned video: a declined card at a hotel desk ("this happened to me"); "Your money's good here."; a crumpled
  bill on a messy table read by SAM 3.1 + Muse Spark into a card; a prepaid card declined at the hotel checkout with
  the reason, then a spoken "raise my hotel card to $180", Confirm, approved, notification; the twist: the feature
  was built live by Meta's Muse Code in the Ignesis Studio; ending: Meta's models built the app that runs on Meta's
  models.
- Order of work: the Ignesis Studio, then Digna's Meta features (voice, the assistant taking actions with Confirm,
  SAM 3.1 for bills; built by hand by the evening of Nov 2 if the Studio isn't ready), then digna.dev, polish and the
  video on Nov 3, submit Nov 4.
