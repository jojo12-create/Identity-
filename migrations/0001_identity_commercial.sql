CREATE TABLE identity_payment_requests (
  id BIGSERIAL PRIMARY KEY,
  quote_reference TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents BETWEEN 100 AND 25000000),
  payment_kind TEXT NOT NULL CHECK (payment_kind IN ('one_time','monthly')),
  stripe_session_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  checkout_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','paid','active','failed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_identity_payment_requests_recent ON identity_payment_requests(created_at DESC);
CREATE TABLE identity_leads (
  id BIGSERIAL PRIMARY KEY,
  company TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  telephone TEXT NOT NULL DEFAULT '',
  sector TEXT NOT NULL DEFAULT 'autre',
  source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'a_contacter',
  last_contact_at TIMESTAMPTZ,
  notes TEXT NOT NULL DEFAULT '',
  opted_out BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_identity_leads_status ON identity_leads(status,created_at DESC);