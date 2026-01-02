-- Fix transaction insert/update errors from UI expecting payment_provider_id
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_provider_id TEXT;

-- Optional: helpful for filtering/reporting
CREATE INDEX IF NOT EXISTS idx_transactions_payment_provider_id
ON public.transactions (payment_provider_id);
