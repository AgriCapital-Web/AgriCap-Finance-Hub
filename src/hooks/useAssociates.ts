import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Associate = Database['public']['Tables']['associates']['Row'];
type AssociateInsert = Database['public']['Tables']['associates']['Insert'];
type AssociateApport = Database['public']['Tables']['associate_contributions']['Row'];
type ApportInsert = Database['public']['Tables']['associate_contributions']['Insert'];

export function useAssociates() {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [apports, setApports] = useState<AssociateApport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAssociates = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('associates').select('*').order('full_name');
      if (error) throw error;
      setAssociates(data || []);
    } catch (err) {
      console.error('Error fetching associates:', err);
    }
  }, []);

  const fetchApports = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('associate_contributions').select('*').order('contribution_date', { ascending: false });
      if (error) throw error;
      setApports(data || []);
    } catch (err) {
      console.error('Error fetching apports:', err);
    }
  }, []);

  const createAssociate = async (associate: AssociateInsert) => {
    try {
      const { error } = await supabase.from('associates').insert([associate]);
      if (error) throw error;
      toast({ title: 'Succès', description: 'Associé créé' });
      fetchAssociates();
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de créer l\'associé', variant: 'destructive' });
      throw err;
    }
  };

  const updateAssociate = async (id: string, updates: Partial<Associate>) => {
    try {
      const { error } = await supabase.from('associates').update(updates).eq('id', id);
      if (error) throw error;
      toast({ title: 'Succès', description: 'Associé mis à jour' });
      fetchAssociates();
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour', variant: 'destructive' });
      throw err;
    }
  };

  const createApport = async (apport: ApportInsert) => {
    try {
      const { error } = await supabase.from('associate_contributions').insert([apport]);
      if (error) throw error;
      toast({ title: 'Succès', description: 'Apport enregistré' });
      fetchAssociates();
      fetchApports();
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible d\'enregistrer l\'apport', variant: 'destructive' });
      throw err;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAssociates(), fetchApports()]);
      setLoading(false);
    };
    loadData();
  }, [fetchAssociates, fetchApports]);

  const totalApports = associates.reduce((sum, a) => sum + (Number(a.total_contribution) || 0), 0);

  // Backward compatibility aliases
  const contributions = apports;
  const createContribution = createApport;
  const totalContributions = totalApports;

  return { 
    associates, 
    apports,
    contributions, // alias
    loading, 
    totalApports,
    totalContributions, // alias
    refetch: () => Promise.all([fetchAssociates(), fetchApports()]), 
    createAssociate, 
    updateAssociate, 
    createApport,
    createContribution // alias
  };
}