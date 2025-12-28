import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Associate = Database['public']['Tables']['associates']['Row'];
type AssociateInsert = Database['public']['Tables']['associates']['Insert'];
type AssociateContribution = Database['public']['Tables']['associate_contributions']['Row'];
type ContributionInsert = Database['public']['Tables']['associate_contributions']['Insert'];

export function useAssociates() {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [contributions, setContributions] = useState<AssociateContribution[]>([]);
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

  const fetchContributions = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('associate_contributions').select('*').order('contribution_date', { ascending: false });
      if (error) throw error;
      setContributions(data || []);
    } catch (err) {
      console.error('Error fetching contributions:', err);
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

  const createContribution = async (contribution: ContributionInsert) => {
    try {
      const { error } = await supabase.from('associate_contributions').insert([contribution]);
      if (error) throw error;
      toast({ title: 'Succès', description: 'Apport enregistré' });
      fetchAssociates();
      fetchContributions();
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible d\'enregistrer l\'apport', variant: 'destructive' });
      throw err;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAssociates(), fetchContributions()]);
      setLoading(false);
    };
    loadData();
  }, [fetchAssociates, fetchContributions]);

  const totalContributions = associates.reduce((sum, a) => sum + (Number(a.total_contribution) || 0), 0);

  return { associates, contributions, loading, totalContributions, refetch: () => Promise.all([fetchAssociates(), fetchContributions()]), createAssociate, updateAssociate, createContribution };
}