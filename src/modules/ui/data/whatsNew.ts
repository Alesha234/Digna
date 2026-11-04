/**
 * What's new on Digna, newest first (Nov 4, 2026). To announce an update, add one entry at the top with a new id:
 * everyone sees a small "New" badge on "What's new" (and a dot on the phone Menu button) until they open the page.
 * Keep each one short and in plain words; never announce real cards before they're real.
 */
export type WhatsNewEntry = { id: string; date: string; title: string; body: string };

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    id: "2026-11-04-survey",
    date: "Nov 4, 2026",
    title: "A quick 3-tap survey",
    body: "Tell us where cards get turned away, in three taps. It's at the bottom of the home page and after a practice payment, and your answers go privately to the Digna team.",
  },
  {
    id: "2026-11-04-no-real-cards",
    date: "Nov 4, 2026",
    title: "Real card numbers stay on your device",
    body: "Practice checkouts only take practice cards. If a real card is typed in, Digna refuses it right away and never sends it anywhere.",
  },
  {
    id: "2026-11-03-bill-card",
    date: "Nov 3, 2026",
    title: "Meet the Digna Bill Card",
    body: "Our cards have a name: a Bill Card is a card for one bill, like the hotel, the rental or the cloud service, paid from your own money with the limit you set.",
  },
  {
    id: "2026-11-03-film",
    date: "Nov 3, 2026",
    title: "See Digna in 3 minutes",
    body: "A short film about Digna is now on the home page, made with Meta's AI.",
  },
  {
    id: "2026-11-03-phone",
    date: "Nov 3, 2026",
    title: "Easier on your phone",
    body: "Bigger buttons, easier-to-read text, and nothing cut off at the edges of small screens.",
  },
  {
    id: "2026-11-02-paid-stamp",
    date: "Nov 2, 2026",
    title: "A green Paid stamp on paid bills",
    body: "Bills you've paid now show a green Paid stamp in Your bills. This feature was built by Meta's Muse Code in Ignesis.",
  },
  {
    id: "2026-11-02-voice",
    date: "Nov 2, 2026",
    title: "Just say it",
    body: "Tap the mic in Ask Digna and say what you need, like \"raise my hotel card to $180.\" Nothing changes until you press Confirm.",
  },
];

export const LATEST_WHATS_NEW = WHATS_NEW[0]?.id ?? "";
