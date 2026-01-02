-- Create payment_providers table for banks and mobile money operators
CREATE TABLE IF NOT EXISTS public.payment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mobile_money', 'bank', 'microfinance')),
  country TEXT DEFAULT 'CI',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_providers
CREATE POLICY "Authenticated users can view payment providers"
ON public.payment_providers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage payment providers"
ON public.payment_providers FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

-- Insert Mobile Money operators
INSERT INTO public.payment_providers (name, type, country) VALUES
  ('Orange Money', 'mobile_money', 'CI'),
  ('Moov Money', 'mobile_money', 'CI'),
  ('MTN Mobile Money', 'mobile_money', 'CI'),
  ('Wave', 'mobile_money', 'CI'),
  ('Djamo', 'mobile_money', 'CI')
ON CONFLICT DO NOTHING;

-- Insert CI Banks
INSERT INTO public.payment_providers (name, type, country) VALUES
  ('SGCI (Société Générale)', 'bank', 'CI'),
  ('Ecobank CI', 'bank', 'CI'),
  ('BICICI', 'bank', 'CI'),
  ('NSIA Banque', 'bank', 'CI'),
  ('SIB (Société Ivoirienne de Banque)', 'bank', 'CI'),
  ('Banque Atlantique CI', 'bank', 'CI'),
  ('Coris Bank CI', 'bank', 'CI'),
  ('BOA Côte d''Ivoire', 'bank', 'CI'),
  ('BNI (Banque Nationale d''Investissement)', 'bank', 'CI'),
  ('BACI (Banque Atlantique)', 'bank', 'CI'),
  ('UBA CI', 'bank', 'CI'),
  ('Versus Bank', 'bank', 'CI'),
  ('Orabank CI', 'bank', 'CI'),
  ('BDU (Banque de l''Union)', 'bank', 'CI'),
  ('CNCE (Caisse Nationale des Caisses d''Épargne)', 'bank', 'CI'),
  ('Baobab (ex Microcred)', 'microfinance', 'CI'),
  ('Advans Côte d''Ivoire', 'microfinance', 'CI'),
  ('Fidelis Finance', 'microfinance', 'CI'),
  ('UNACOOPEC-CI', 'microfinance', 'CI'),
  ('RCMEC', 'microfinance', 'CI')
ON CONFLICT DO NOTHING;

-- Add columns to documents table for linking to users/intervenants/associates/transactions
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS user_profile_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS stakeholder_id UUID REFERENCES public.stakeholders(id),
ADD COLUMN IF NOT EXISTS associate_id UUID REFERENCES public.associates(id),
ADD COLUMN IF NOT EXISTS is_linked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS linked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS storage_year INTEGER DEFAULT EXTRACT(YEAR FROM now()),
ADD COLUMN IF NOT EXISTS storage_month INTEGER DEFAULT EXTRACT(MONTH FROM now());

-- Create index for faster queries on documents
CREATE INDEX IF NOT EXISTS idx_documents_stakeholder ON public.documents(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_documents_associate ON public.documents(associate_id);
CREATE INDEX IF NOT EXISTS idx_documents_transaction ON public.documents(transaction_id);
CREATE INDEX IF NOT EXISTS idx_documents_is_linked ON public.documents(is_linked);

-- Create regions table for Côte d'Ivoire
CREATE TABLE IF NOT EXISTS public.regions_ci (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  district TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.regions_ci ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view regions"
ON public.regions_ci FOR SELECT
TO authenticated
USING (true);

-- Insert Côte d'Ivoire regions
INSERT INTO public.regions_ci (name, district) VALUES
  ('Abidjan', 'District Autonome d''Abidjan'),
  ('Bas-Sassandra', 'District des Montagnes'),
  ('Comoé', 'District du Comoé'),
  ('Denguélé', 'District du Woroba'),
  ('Gôh-Djiboua', 'District du Gôh-Djiboua'),
  ('Lacs', 'District des Lagunes'),
  ('Lagunes', 'District des Lagunes'),
  ('Montagnes', 'District des Montagnes'),
  ('Sassandra-Marahoué', 'District du Sassandra-Marahoué'),
  ('Savanes', 'District des Savanes'),
  ('Vallée du Bandama', 'District de la Vallée du Bandama'),
  ('Woroba', 'District du Woroba'),
  ('Yamoussoukro', 'District Autonome de Yamoussoukro'),
  ('Zanzan', 'District du Zanzan'),
  ('Haut-Sassandra', 'District du Sassandra-Marahoué'),
  ('Poro', 'District des Savanes'),
  ('Gbêkê', 'District de la Vallée du Bandama'),
  ('Indénié-Djuablin', 'District du Comoé'),
  ('Tonkpi', 'District des Montagnes'),
  ('Cavally', 'District des Montagnes'),
  ('Bafing', 'District du Woroba'),
  ('Bagoué', 'District des Savanes'),
  ('Bélier', 'District des Lacs'),
  ('Béré', 'District du Woroba'),
  ('Bounkani', 'District du Zanzan'),
  ('Folon', 'District du Denguélé'),
  ('Gbôklé', 'District du Bas-Sassandra'),
  ('Gontougo', 'District du Zanzan'),
  ('Guémon', 'District des Montagnes'),
  ('Hambol', 'District de la Vallée du Bandama'),
  ('Iffou', 'District des Lacs'),
  ('Kabadougou', 'District du Denguélé'),
  ('La Mé', 'District des Lagunes'),
  ('Lôh-Djiboua', 'District du Gôh-Djiboua'),
  ('Marahoué', 'District du Sassandra-Marahoué'),
  ('Moronou', 'District des Lacs'),
  ('N''Zi', 'District de la Vallée du Bandama'),
  ('Nawa', 'District du Bas-Sassandra'),
  ('San-Pédro', 'District du Bas-Sassandra'),
  ('Sud-Comoé', 'District du Comoé'),
  ('Tchologo', 'District des Savanes'),
  ('Worodougou', 'District du Woroba')
ON CONFLICT (name) DO NOTHING;

-- Add region column to stakeholders
ALTER TABLE public.stakeholders
ADD COLUMN IF NOT EXISTS region TEXT;

-- Function to update associate total_contribution
CREATE OR REPLACE FUNCTION public.update_associate_contribution()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.associates
    SET total_contribution = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.associate_contributions
      WHERE associate_id = NEW.associate_id
    )
    WHERE id = NEW.associate_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE public.associates
    SET total_contribution = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.associate_contributions
      WHERE associate_id = OLD.associate_id
    )
    WHERE id = OLD.associate_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-update associate contributions
DROP TRIGGER IF EXISTS trg_update_associate_contribution ON public.associate_contributions;
CREATE TRIGGER trg_update_associate_contribution
AFTER INSERT OR UPDATE OR DELETE ON public.associate_contributions
FOR EACH ROW EXECUTE FUNCTION public.update_associate_contribution();

-- Function to mark document as linked when transaction_id is set
CREATE OR REPLACE FUNCTION public.mark_document_linked()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_id IS NOT NULL AND (OLD.transaction_id IS NULL OR OLD.transaction_id != NEW.transaction_id) THEN
    NEW.is_linked := true;
    NEW.linked_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_mark_document_linked ON public.documents;
CREATE TRIGGER trg_mark_document_linked
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.mark_document_linked();