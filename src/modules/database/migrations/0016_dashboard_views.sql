DROP VIEW IF EXISTS v_wallet_balance;
CREATE VIEW v_wallet_balance WITH (security_invoker=true) AS SELECT * FROM wallets;
DROP VIEW IF EXISTS v_card_progress;
CREATE VIEW v_card_progress WITH (security_invoker=true) AS SELECT * FROM virtual_cards;
DROP VIEW IF EXISTS v_recent_activity;
CREATE VIEW v_recent_activity WITH (security_invoker=true) AS SELECT * FROM transactions;
DROP VIEW IF EXISTS v_unread_warnings;
CREATE VIEW v_unread_warnings WITH (security_invoker=true) AS SELECT * FROM alerts;
GRANT SELECT ON v_wallet_balance, v_card_progress, v_recent_activity, v_unread_warnings TO authenticated;
