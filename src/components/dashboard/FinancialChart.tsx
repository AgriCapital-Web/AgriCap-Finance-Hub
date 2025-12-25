import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { ChartData } from '@/types';
import { formatCurrency } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FinancialChartProps {
  data: ChartData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const FinancialChart = ({ data }: FinancialChartProps) => {
  return (
    <Card className="animate-fadeIn">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Évolution Financière</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="area" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="area">Courbes</TabsTrigger>
            <TabsTrigger value="bar">Barres</TabsTrigger>
          </TabsList>

          <TabsContent value="area" className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(145, 63%, 35%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(145, 63%, 35%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  name="Entrées"
                  stroke="hsl(145, 63%, 35%)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  name="Sorties"
                  stroke="hsl(0, 72%, 51%)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorExpenses)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="bar" className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="income" 
                  name="Entrées"
                  fill="hsl(145, 63%, 35%)" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="expenses" 
                  name="Sorties"
                  fill="hsl(0, 72%, 51%)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
