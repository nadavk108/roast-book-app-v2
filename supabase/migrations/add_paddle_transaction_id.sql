-- Migrate from Stripe to Paddle
-- Adds paddle_transaction_id column to roast_books table

ALTER TABLE roast_books ADD COLUMN IF NOT EXISTS paddle_transaction_id TEXT;
