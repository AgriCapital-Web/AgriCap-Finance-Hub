-- =====================================================
-- OPTIMISATION BDD POUR 5M+ DONNÉES
-- =====================================================

-- Index sur les transactions pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(validation_status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON public.transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_date_type ON public.transactions(date DESC, transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_department ON public.transactions(department_id) WHERE department_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_stakeholder ON public.transactions(stakeholder_id) WHERE stakeholder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_associate ON public.transactions(associate_id) WHERE associate_id IS NOT NULL;

-- Index composite pour filtrage fréquent
CREATE INDEX IF NOT EXISTS idx_transactions_filter ON public.transactions(date DESC, transaction_type, validation_status);

-- Index sur les contributions des associés
CREATE INDEX IF NOT EXISTS idx_associate_contributions_associate ON public.associate_contributions(associate_id);
CREATE INDEX IF NOT EXISTS idx_associate_contributions_date ON public.associate_contributions(contribution_date DESC);
CREATE INDEX IF NOT EXISTS idx_associate_contributions_composite ON public.associate_contributions(associate_id, contribution_date DESC);

-- Index sur les associés
CREATE INDEX IF NOT EXISTS idx_associates_active ON public.associates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_associates_name ON public.associates(full_name);

-- Index sur les documents pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_documents_transaction ON public.documents(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_storage ON public.documents(storage_year, storage_month);
CREATE INDEX IF NOT EXISTS idx_documents_linked ON public.documents(is_linked);

-- Index sur stakeholders
CREATE INDEX IF NOT EXISTS idx_stakeholders_status ON public.stakeholders(operational_status);
CREATE INDEX IF NOT EXISTS idx_stakeholders_active ON public.stakeholders(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_stakeholders_name ON public.stakeholders(name);

-- Index sur profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active) WHERE is_active = true;

-- Index sur user_roles pour lookup rapide
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Index sur notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- Index sur validations
CREATE INDEX IF NOT EXISTS idx_validations_transaction ON public.validations(transaction_id);
CREATE INDEX IF NOT EXISTS idx_validations_status ON public.validations(to_status);

-- Statistiques pour optimiser le query planner
ANALYZE public.transactions;
ANALYZE public.associate_contributions;
ANALYZE public.associates;
ANALYZE public.documents;
ANALYZE public.stakeholders;
ANALYZE public.profiles;
ANALYZE public.user_roles;

-- Commentaires
COMMENT ON INDEX idx_transactions_filter IS 'Index composite pour recherche filtrée transactions';
COMMENT ON INDEX idx_associate_contributions_composite IS 'Index composite pour historique apports par associé';