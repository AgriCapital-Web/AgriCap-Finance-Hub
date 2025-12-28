import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type ValidationStatus = Database['public']['Enums']['validation_status'];

interface TransactionFilters {
  type?: 'income' | 'expense';
  status?: ValidationStatus;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
}

export function useTransactions(filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (filters?.type) {
        query = query.eq('transaction_type', filters.type);
      }
      if (filters?.status) {
        query = query.eq('validation_status', filters.status);
      }
      if (filters?.departmentId) {
        query = query.eq('department_id', filters.departmentId);
      }
      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [filters?.type, filters?.status, filters?.departmentId, filters?.startDate, filters?.endDate]);

  const createTransaction = async (transaction: TransactionInsert) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Succès', description: 'Transaction créée' });
      fetchTransactions();
      return data;
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de créer la transaction', variant: 'destructive' });
      throw err;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, error, refetch: fetchTransactions, createTransaction };
}

export function useTransactionSummary() {
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    pendingCount: 0,
    approvedCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('amount, transaction_type, validation_status');

        if (error) throw error;

        const totalIncome = data?.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const totalExpenses = data?.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const pendingCount = data?.filter(t => t.validation_status === 'draft' || t.validation_status === 'submitted').length || 0;
        const approvedCount = data?.filter(t => t.validation_status === 'dg_validated' || t.validation_status === 'locked').length || 0;

        setSummary({ totalIncome, totalExpenses, balance: totalIncome - totalExpenses, pendingCount, approvedCount });
      } catch (err) {
        console.error('Error fetching summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return { summary, loading };
}