import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Department = Database['public']['Tables']['departments']['Row'];

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les départements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createDepartment = async (dept: { name: string; code: string; description?: string }) => {
    try {
      const { error } = await supabase
        .from('departments')
        .insert(dept);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Département créé',
      });
      fetchDepartments();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le département',
        variant: 'destructive',
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return { departments, loading, refetch: fetchDepartments, createDepartment };
}