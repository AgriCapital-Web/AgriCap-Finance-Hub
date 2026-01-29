import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type ValidationStatus = Database['public']['Enums']['validation_status'];

interface TransactionFilters {
  type?: 'income' | 'expense';
  status?: ValidationStatus;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 50;

export function usePaginatedTransactions(filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
  });

  // Cache pour éviter les refetch inutiles
  const cache = useRef<Map<string, Transaction[]>>(new Map());
  const abortController = useRef<AbortController | null>(null);

  const getCacheKey = useCallback((page: number, filters?: TransactionFilters) => {
    return JSON.stringify({ page, ...filters });
  }, []);

  const fetchTransactions = useCallback(async (page: number = 1) => {
    // Annuler la requête précédente si elle existe
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    const cacheKey = getCacheKey(page, filters);
    
    // Vérifier le cache
    if (cache.current.has(cacheKey)) {
      setTransactions(cache.current.get(cacheKey)!);
      setPagination(prev => ({ ...prev, page }));
      return;
    }

    try {
      setLoading(true);
      
      // Calculer le range pour la pagination
      const from = (page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      // Construire la requête avec filtres
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .order('date', { ascending: false })
        .range(from, to);

      // Appliquer les filtres
      if (filters?.type) {
        query = query.eq('transaction_type', filters.type);
      }
      if (filters?.status) {
        query = query.eq('validation_status', filters.status);
      }
      if (filters?.departmentId && filters.departmentId !== 'all') {
        query = query.eq('department_id', filters.departmentId);
      }
      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters?.searchTerm) {
        query = query.or(`description.ilike.%${filters.searchTerm}%,reference.ilike.%${filters.searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pagination.pageSize);

      // Mettre en cache
      cache.current.set(cacheKey, data || []);

      // Limiter la taille du cache à 20 pages
      if (cache.current.size > 20) {
        const firstKey = cache.current.keys().next().value;
        cache.current.delete(firstKey);
      }

      setTransactions(data || []);
      setPagination(prev => ({
        ...prev,
        page,
        totalCount,
        totalPages,
      }));
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err as Error);
        console.error('Error fetching transactions:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.pageSize, getCacheKey]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchTransactions(page);
    }
  }, [fetchTransactions, pagination.totalPages]);

  const nextPage = useCallback(() => {
    goToPage(pagination.page + 1);
  }, [goToPage, pagination.page]);

  const previousPage = useCallback(() => {
    goToPage(pagination.page - 1);
  }, [goToPage, pagination.page]);

  const setPageSize = useCallback((size: number) => {
    cache.current.clear();
    setPagination(prev => ({
      ...prev,
      pageSize: size,
      page: 1,
    }));
  }, []);

  const refetch = useCallback(() => {
    cache.current.clear();
    fetchTransactions(pagination.page);
  }, [fetchTransactions, pagination.page]);

  // Reset lors du changement de filtres
  useEffect(() => {
    cache.current.clear();
    fetchTransactions(1);
  }, [filters?.type, filters?.status, filters?.departmentId, filters?.startDate, filters?.endDate, filters?.searchTerm]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return {
    transactions,
    loading,
    error,
    pagination,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    refetch,
    hasNextPage: pagination.page < pagination.totalPages,
    hasPreviousPage: pagination.page > 1,
  };
}

// Hook pour le chargement infini (lazy loading)
export function useInfiniteTransactions(filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const pageRef = useRef(0);
  const pageSize = 50;

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = pageRef.current + 1;
      const from = (nextPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .range(from, to);

      if (filters?.type) {
        query = query.eq('transaction_type', filters.type);
      }
      if (filters?.status) {
        query = query.eq('validation_status', filters.status);
      }
      if (filters?.departmentId && filters.departmentId !== 'all') {
        query = query.eq('department_id', filters.departmentId);
      }
      if (filters?.searchTerm) {
        query = query.or(`description.ilike.%${filters.searchTerm}%,reference.ilike.%${filters.searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        setTransactions(prev => [...prev, ...data]);
        pageRef.current = nextPage;
        setHasMore(data.length === pageSize);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error loading more transactions:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [filters, loadingMore, hasMore]);

  const reset = useCallback(async () => {
    setLoading(true);
    setTransactions([]);
    pageRef.current = 0;
    setHasMore(true);
    
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .range(0, pageSize - 1);

      if (filters?.type) {
        query = query.eq('transaction_type', filters.type);
      }
      if (filters?.status) {
        query = query.eq('validation_status', filters.status);
      }
      if (filters?.departmentId && filters.departmentId !== 'all') {
        query = query.eq('department_id', filters.departmentId);
      }
      if (filters?.searchTerm) {
        query = query.or(`description.ilike.%${filters.searchTerm}%,reference.ilike.%${filters.searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTransactions(data || []);
      pageRef.current = 1;
      setHasMore((data?.length || 0) === pageSize);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    reset();
  }, [filters?.type, filters?.status, filters?.departmentId, filters?.searchTerm]);

  return {
    transactions,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    reset,
  };
}
