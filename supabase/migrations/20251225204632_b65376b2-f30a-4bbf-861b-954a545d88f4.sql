
-- 1. Create ENUM types
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'comptable', 'raf', 'cabinet', 'auditeur');
CREATE TYPE public.operational_status AS ENUM ('employe_interne', 'prestataire_interne', 'prestataire_externe', 'consultant', 'fournisseur', 'autre');
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
CREATE TYPE public.validation_status AS ENUM ('draft', 'submitted', 'raf_validated', 'dg_validated', 'locked', 'rejected');
CREATE TYPE public.payment_method AS ENUM ('cash', 'bank', 'mobile_money', 'cheque', 'transfer');

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  title TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 4. Create departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES public.departments(id),
  description TEXT,
  budget DECIMAL(15,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create chart_of_accounts (Plan comptable SYSCOHADA)
CREATE TABLE public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number TEXT NOT NULL UNIQUE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  parent_account TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Create stakeholders (intervenants)
CREATE TABLE public.stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  operational_status operational_status NOT NULL,
  contract_type TEXT,
  department_id UUID REFERENCES public.departments(id),
  email TEXT,
  phone TEXT,
  address TEXT,
  bank_account TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type transaction_type NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'XOF',
  department_id UUID REFERENCES public.departments(id),
  project_id UUID REFERENCES public.projects(id),
  account_id UUID REFERENCES public.chart_of_accounts(id),
  stakeholder_id UUID REFERENCES public.stakeholders(id),
  source TEXT,
  nature TEXT,
  payment_method payment_method,
  description TEXT,
  reference TEXT,
  validation_status validation_status DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  document_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Create validations table (workflow history)
CREATE TABLE public.validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  from_status validation_status NOT NULL,
  to_status validation_status NOT NULL,
  validated_by UUID REFERENCES auth.users(id),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Create budgets table
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES public.departments(id),
  project_id UUID REFERENCES public.projects(id),
  account_id UUID REFERENCES public.chart_of_accounts(id),
  fiscal_year INTEGER NOT NULL,
  period TEXT,
  amount DECIMAL(15,2) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 14. Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 15. Create function to check if user has any admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'admin')
  )
$$;

-- 16. Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- 17. RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.is_admin(auth.uid()));

-- 18. RLS Policies for user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.is_admin(auth.uid()));

-- 19. RLS Policies for departments (readable by all authenticated)
CREATE POLICY "Authenticated users can view departments" ON public.departments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage departments" ON public.departments
  FOR ALL USING (public.is_admin(auth.uid()));

-- 20. RLS Policies for projects
CREATE POLICY "Authenticated users can view projects" ON public.projects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage projects" ON public.projects
  FOR ALL USING (public.is_admin(auth.uid()));

-- 21. RLS Policies for chart_of_accounts
CREATE POLICY "Authenticated users can view accounts" ON public.chart_of_accounts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage accounts" ON public.chart_of_accounts
  FOR ALL USING (public.is_admin(auth.uid()));

-- 22. RLS Policies for stakeholders
CREATE POLICY "Authenticated users can view stakeholders" ON public.stakeholders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and comptables can manage stakeholders" ON public.stakeholders
  FOR ALL USING (
    public.is_admin(auth.uid()) OR 
    public.has_role(auth.uid(), 'comptable') OR
    public.has_role(auth.uid(), 'raf')
  );

-- 23. RLS Policies for transactions
CREATE POLICY "Users can view transactions" ON public.transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create transactions" ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their draft transactions" ON public.transactions
  FOR UPDATE USING (
    created_by = auth.uid() AND validation_status = 'draft'
  );

CREATE POLICY "Admins and RAF can manage all transactions" ON public.transactions
  FOR ALL USING (
    public.is_admin(auth.uid()) OR 
    public.has_role(auth.uid(), 'raf')
  );

-- 24. RLS Policies for documents
CREATE POLICY "Authenticated users can view documents" ON public.documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can upload documents" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Admins can manage documents" ON public.documents
  FOR ALL USING (public.is_admin(auth.uid()));

-- 25. RLS Policies for validations
CREATE POLICY "Authenticated users can view validations" ON public.validations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Validators can create validations" ON public.validations
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin(auth.uid()) OR 
    public.has_role(auth.uid(), 'raf')
  );

-- 26. RLS Policies for budgets
CREATE POLICY "Authenticated users can view budgets" ON public.budgets
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage budgets" ON public.budgets
  FOR ALL USING (public.is_admin(auth.uid()));

-- 27. RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- 28. Create trigger for new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, title)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'title', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 29. Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 30. Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stakeholders_updated_at BEFORE UPDATE ON public.stakeholders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 31. Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- 32. Storage policies
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND public.is_admin(auth.uid()));

-- 33. Insert default departments
INSERT INTO public.departments (name, code, description) VALUES
  ('Direction Générale', 'DG', 'Direction et administration générale'),
  ('Comptabilité', 'COMPTA', 'Service comptable'),
  ('Ressources Humaines', 'RH', 'Gestion du personnel'),
  ('Production', 'PROD', 'Production agricole'),
  ('Commercial', 'COM', 'Ventes et marketing'),
  ('Logistique', 'LOG', 'Transport et logistique');

-- 34. Insert basic SYSCOHADA chart of accounts
INSERT INTO public.chart_of_accounts (account_number, account_name, account_type) VALUES
  ('10', 'Capital', 'equity'),
  ('12', 'Report à nouveau', 'equity'),
  ('13', 'Résultat net', 'equity'),
  ('40', 'Fournisseurs', 'liability'),
  ('41', 'Clients', 'asset'),
  ('52', 'Banques', 'asset'),
  ('57', 'Caisse', 'asset'),
  ('60', 'Achats', 'expense'),
  ('61', 'Transports', 'expense'),
  ('62', 'Services extérieurs', 'expense'),
  ('63', 'Autres services extérieurs', 'expense'),
  ('64', 'Impôts et taxes', 'expense'),
  ('65', 'Autres charges', 'expense'),
  ('66', 'Charges de personnel', 'expense'),
  ('70', 'Ventes', 'income'),
  ('71', 'Subventions', 'income'),
  ('75', 'Autres produits', 'income'),
  ('77', 'Revenus financiers', 'income');
