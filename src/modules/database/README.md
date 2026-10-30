# PayProxy Database — Phone App Guide

For **frontend / backend / AI** teams. No secrets here. All money in **cents-as-integer** (`*_cents`). No floats.

## 1) Overview

PayProxy is a phone-first prepaid wallet + capped virtual cards + bill scanner + assistant.

| Store | Purpose | Owner |
|---|---|---|
| `profiles` | Per-user settings, consent, demo flag | 1 row per `auth.users.id` |
| `wallets` | Spendable balance per user | `user_id` |
| `virtual_cards` | Capped cards for test-mode ledger | `user_id` |
| `transactions` | Charges + declines (immutable ledger) | `user_id`, `card_id` |
| `bill_scans` | Photo-bill parse results + suggested cap | `user_id` |
| `assistant_messages` | Q&A history for money-assistant | `user_id`, `transaction_id` |
| `alerts` | Dashboard warnings (`near_cap`, `low_balance`) | `user_id`, `card_id` |
| Storage `bill-photos` | Original bill JPG/PNG uploads | prefix `user_id/` |

Flow: `bill-photos` upload → `analyze-bill-photo` → `bill_scans` → user confirms → creates `virtual_cards` with `cap_cents` → spend via test-mode ledger → `transactions` + `wallets` decrement → `alerts` → ask `money-assistant`.

## 2) Schema Summary

All money: `INTEGER` cents. All timestamps: `timestamptz DEFAULT now()`.

**`profiles`**
- `id UUID PK = auth.uid()`, `email TEXT`
- `display_name TEXT`, `consent_ai BOOLEAN DEFAULT false`
- `is_demo BOOLEAN DEFAULT false`, `created_at`

**`wallets`**
- `id UUID PK`, `user_id UUID FK auth.users`
- `balance_cents INTEGER >= 0` (e.g. `50000` = $500.00)
- `currency TEXT DEFAULT 'USD'`, `updated_at`

**`virtual_cards`**
- `id UUID PK`, `user_id UUID`, `label TEXT` (e.g. "Netflix test")
- `last4 TEXT`, `exp_month INT`, `exp_year INT`
- `cap_cents INTEGER > 0` — lifetime cap
- `spent_cents INTEGER DEFAULT 0` — lifetime spent, never exceeds cap
- `status TEXT`: `active` \| `frozen` \| `closed`
- `created_at`, `updated_at`

**`transactions`**
- `id UUID PK`, `user_id UUID`, `card_id UUID FK virtual_cards`
- `amount_cents INTEGER > 0`, `merchant TEXT`
- `type TEXT`: `charge` \| `decline` (append-only, never update/delete)
- `reason TEXT NULL` (only for declines: `over_cap`, `frozen`, `expired`, `insufficient_balance`)
- `created_at`

**`bill_scans`**
- `id UUID PK`, `user_id UUID`, `photo_path TEXT` (key in `bill-photos`)
- `merchant TEXT`, `amount_cents INTEGER`, `due_date DATE NULL`
- `suggested_cap_cents INTEGER`, `raw_json JSONB`, `created_at`

**`assistant_messages`**
- `id UUID PK`, `user_id UUID`, `transaction_id UUID NULL`
- `role TEXT`: `user` \| `assistant`, `content TEXT`, `created_at`

**`alerts`**
- `id UUID PK`, `user_id UUID`, `card_id UUID NULL`
- `kind TEXT`: `near_cap` \| `low_balance`, `message TEXT`
- `is_read BOOLEAN DEFAULT false`, `created_at`

**Storage `bill-photos` (private)**
- Key: `user_id/<uuid>.<jpg|png>`, max ~5 MB, phone camera upload.

## 3) RLS Model

- **Authenticated only.** No `anon` read/write. Every query needs a user JWT.
- **Owner-only:** every table has `user_id = auth.uid()` policy for `SELECT/INSERT/UPDATE/DELETE` (transactions: no `UPDATE/DELETE`).
- **No cross-user access:** never query by another user's id; join always on `auth.uid()`.
- **Storage:** `bill-photos` policies match prefix: object name must start with `auth.uid() || '/'`. No public URLs; use signed URLs (60s) for phone display.
- **Service role** bypasses RLS — server functions only, never ship to phone app.

Example pattern (all tables):
```sql
CREATE POLICY "owner" ON wallets FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

## 4) Test-Mode Ledger Rules (Atomic)

All spends go through one Postgres function (single transaction). Phone app never writes `spent_cents` / `balance_cents` directly.

`try_charge(p_card_id, p_amount_cents, p_merchant)` order:
1. Lock `virtual_cards` + `wallets` rows (`FOR UPDATE`).
2. Block if `status = frozen/closed` → insert `decline/frozen`.
3. Block if expired (`exp_year/exp_month < now`) → insert `decline/expired`.
4. Block if `spent_cents + amount > cap_cents` → insert `decline/over_cap`.
5. Block if `wallets.balance_cents < amount` → insert `decline/insufficient_balance`.
6. Else: `spent_cents += amount`, `balance_cents -= amount`, insert `charge`, refresh alerts.

**Dashboard warnings** (`alerts`, upsert per card):
- `near_cap`: when `spent_cents >= 0.8 * cap_cents` → "Card X at 80% of cap."
- `low_balance`: when `wallets.balance_cents < 2000` ($20) → "Wallet low."

Declines are also logged as `transactions(type='decline')` so the phone timeline shows them.

## 5) Indexes & Triggers

**Indexes:**
```sql
CREATE INDEX ON wallets (user_id);
CREATE INDEX ON virtual_cards (user_id);
CREATE INDEX ON transactions (user_id, created_at DESC);
CREATE INDEX ON transactions (card_id, created_at DESC);
CREATE INDEX ON bill_scans (user_id, created_at DESC);
CREATE INDEX ON assistant_messages (user_id, created_at DESC);
CREATE INDEX ON alerts (user_id, is_read, created_at DESC);
```

**Triggers:**
- `set_updated_at`: `BEFORE UPDATE` on `wallets`, `virtual_cards` → `NEW.updated_at = now()`.
- `validate_cents`: `BEFORE INSERT/UPDATE` reject negative `balance_cents`, `spent_cents > cap_cents`.
- `refresh_alerts()`: `AFTER INSERT ON transactions` → upsert `near_cap` / `low_balance`, mark read when recovered.
- Never add triggers that mutate `transactions` history.

## 6) Server Contracts (Edge Functions)

Phone app calls via `POST` with user JWT. Never call with service key from phone.

### Function I/O

| Function | Input (JSON) | Output (JSON) |
|---|---|---|
| `money-assistant` | `{ transactionId: string, question: string }` | `{ explanation: string, nextSteps: string[] }` |
| `analyze-bill-photo` | multipart `photo` (jpg/png) | `{ merchant: string, amountCents: number, dueDate: string\|null, suggestedCap: number }` |
| `try-charge` (db fn) | `(p_card_id, p_amount_cents, p_merchant)` | `{ ok: boolean, type: charge\|decline, reason? }` |

**`money-assistant`**
- Request: `POST /functions/v1/money-assistant` `{ "transactionId": "uuid", "question": "Why declined?" }`
- Loads transaction + card (RLS-checked), calls LLM server-side, saves both sides to `assistant_messages`.
- Success: `{ "explanation": "Over cap by $2...", "nextSteps": ["Raise cap", "Use another card"] }`

**`analyze-bill-photo`**
- Request: `POST /functions/v1/analyze-bill-photo` form-data `photo=@bill.jpg`
- Uploads to `bill-photos/user_id/uuid.jpg`, runs OCR+LLM server-side, inserts `bill_scans`.
- Success: `{ "merchant": "ConEd", "amountCents": 8420, "dueDate": "2026-11-15", "suggestedCap": 9300 }` (cap = amount + ~10% buffer, rounded).

### Error Codes

| Code | Meaning | When |
|---|---|---|
| `401` | Unauthorized | Missing/expired JWT |
| `403` | Forbidden | `transactionId` belongs to another user; storage prefix mismatch |
| `400` | Bad request | Missing `transactionId/question`, bad photo type, `amount <= 0` |
| `502` | Upstream fail | LLM/OCR down — phone should show retry, nothing was written |

## 7) Demo Seeding & Env

**Seed (dev only, one demo user):** 1 wallet (`$500.00`), 2 cards (`Netflix test` cap $30, `Ads test` cap $100, one `frozen`), 3 charges + 1 decline, 1 `bill_scans`, 1 `near_cap` alert. Guard with `profiles.is_demo = true`; wipe with `DELETE ... WHERE user_id = <demo-id>`.

**Env keys — server-side only, never in phone bundle:**
- `LLAMA_SPARK_KEY` — LLM for `money-assistant` + `analyze-bill-photo`.
- `SAM31_URL` — OCR/vision endpoint for bill photos.

Phone app needs only: Supabase URL + anon key, `bill-photos` upload (auth), and the two function URLs above.
