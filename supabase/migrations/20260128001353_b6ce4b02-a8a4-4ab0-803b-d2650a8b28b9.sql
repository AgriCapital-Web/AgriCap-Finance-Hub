-- Add missing columns to associates table
ALTER TABLE public.associates 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS contact_person_name text,
ADD COLUMN IF NOT EXISTS contact_person_phone text;

-- Add comment for documentation
COMMENT ON COLUMN public.associates.address IS 'Domicile de l''associé';
COMMENT ON COLUMN public.associates.photo_url IS 'URL de la photo de l''associé';
COMMENT ON COLUMN public.associates.contact_person_name IS 'Nom de la personne à contacter';
COMMENT ON COLUMN public.associates.contact_person_phone IS 'Téléphone de la personne à contacter';