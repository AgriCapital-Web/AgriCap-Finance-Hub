import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChartData } from '@/types';

export function useChartData() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const { data, error } = await supabase
          .from('transactions')
          .select('date, amount, transaction_type')
          .gte('date', `${currentYear}-01-01`)
          .lte('date', `${currentYear}-12-31`);

        if (error) throw error;

        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        
        const chartData = months.map((name, index) => {
          const monthTransactions = data?.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === index;
          }) || [];

          const income = monthTransactions
            .filter(t => t.transaction_type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          const expenses = monthTransactions
            .filter(t => t.transaction_type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          return {
            name,
            income,
            expenses,
            balance: income - expenses,
          };
        });

        setChartData(chartData);
      } catch (err) {
        console.error('Error fetching chart data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  return { chartData, loading };
}

export function useReportData(startDate: string, endDate: string, departmentId?: string) {
  const [data, setData] = useState<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    byCategory: { name: string; value: number; color: string }[];
    byDepartment: { name: string; income: number; expenses: number }[];
    transactions: any[];
  }>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    byCategory: [],
    byDepartment: [],
    transactions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('transactions')
          .select('*, departments(name)')
          .gte('date', startDate)
          .lte('date', endDate);

        if (departmentId && departmentId !== 'all') {
          query = query.eq('department_id', departmentId);
        }

        const { data: transactions, error } = await query;
        if (error) throw error;

        const totalIncome = transactions?.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const totalExpenses = transactions?.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        // Group by nature/category
        const categoryMap = new Map<string, number>();
        transactions?.filter(t => t.transaction_type === 'expense').forEach(t => {
          const cat = t.nature || 'Autre';
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(t.amount));
        });

        const colors = ['hsl(0, 72%, 51%)', 'hsl(25, 95%, 53%)', 'hsl(45, 93%, 47%)', 'hsl(145, 63%, 35%)', 'hsl(200, 80%, 50%)', 'hsl(280, 70%, 50%)'];
        const byCategory = Array.from(categoryMap.entries()).map(([name, value], i) => ({
          name,
          value,
          color: colors[i % colors.length],
        }));

        // Group by department
        const { data: departments } = await supabase.from('departments').select('id, name');
        const byDepartment = departments?.map(dept => ({
          name: dept.name,
          income: transactions?.filter(t => t.department_id === dept.id && t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0,
          expenses: transactions?.filter(t => t.department_id === dept.id && t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        })) || [];

        setData({
          totalIncome,
          totalExpenses,
          balance: totalIncome - totalExpenses,
          byCategory,
          byDepartment,
          transactions: transactions || [],
        });
      } catch (err) {
        console.error('Error fetching report data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, departmentId]);

  return { data, loading };
}
