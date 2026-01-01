import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileText, Download, Printer, Calendar, Building2 } from 'lucide-react';
import { useReportData } from '@/hooks/useChartData';
import { useDepartments } from '@/hooks/useDepartments';
import { formatCurrency } from '@/lib/mockData';
import { exportFinancialReportPDF, exportBalanceSheetPDF } from '@/lib/pdfExport';
import { exportFinancialReportExcel } from '@/lib/excelExport';
import { useToast } from '@/hooks/use-toast';

const Reports = () => {
  const { toast } = useToast();
  const [periodType, setPeriodType] = useState('monthly');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { departments } = useDepartments();
  const { data, loading } = useReportData(startDate, endDate, selectedDepartment);

  const handleExportPDF = () => {
    if (data.transactions.length === 0) {
      toast({ title: 'Aucune donnée', description: 'Ajoutez des transactions pour générer un rapport', variant: 'destructive' });
      return;
    }
    exportFinancialReportPDF({
      title: 'Rapport Financier',
      period: `${startDate} au ${endDate}`,
      totalIncome: data.totalIncome,
      totalExpenses: data.totalExpenses,
      balance: data.balance,
      byCategory: data.byCategory,
    });
    toast({ title: 'PDF généré', description: 'Le rapport a été téléchargé' });
  };

  const handleExportExcel = () => {
    if (data.transactions.length === 0) {
      toast({ title: 'Aucune donnée', description: 'Ajoutez des transactions pour générer un rapport', variant: 'destructive' });
      return;
    }
    exportFinancialReportExcel({
      title: 'Rapport Financier',
      period: `${startDate} au ${endDate}`,
      ...data,
    });
    toast({ title: 'Excel généré', description: 'Le fichier a été téléchargé' });
  };

  const handleExportBalancePDF = () => {
    exportBalanceSheetPDF({
      period: `${startDate} au ${endDate}`,
      assets: [
        { label: 'Caisse', amount: data.balance },
        { label: 'Banque', amount: 0 },
        { label: 'Matériel', amount: data.byCategory.find(c => c.name === 'Achats de Matériel')?.value || 0 },
      ],
      liabilities: [
        { label: 'Capital Social', amount: 5000000 },
        { label: 'Apports Associés', amount: data.totalIncome },
        { label: 'Résultat', amount: -data.totalExpenses },
      ],
    });
    toast({ title: 'Bilan PDF généré', description: 'Le bilan a été téléchargé' });
  };

  return (
    <MainLayout 
      title="Rapports" 
      subtitle="États financiers et analyses"
    >
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Paramètres du rapport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Type de période</Label>
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Journalier</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="quarterly">Trimestriel</SelectItem>
                  <SelectItem value="semi-annual">Semestriel</SelectItem>
                  <SelectItem value="annual">Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date début</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Département
              </Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les départements</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2">
                <Button onClick={handleExportPDF} className="flex-1 gap-2">
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
                <Button onClick={handleExportExcel} variant="outline" className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Excel
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="summary">Synthèse</TabsTrigger>
          <TabsTrigger value="balance">Bilan</TabsTrigger>
          <TabsTrigger value="cashflow">Trésorerie</TabsTrigger>
          <TabsTrigger value="department">Par Département</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Summary Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">État Financier</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleExportPDF}>
                  <Printer className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-muted-foreground">Total des Entrées</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(data.totalIncome)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-muted-foreground">Total des Sorties</span>
                      <span className="font-bold text-red-600">{formatCurrency(data.totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-primary/5 rounded-lg px-4">
                      <span className="font-semibold text-foreground">Solde Net</span>
                      <span className="text-2xl font-bold text-primary">{formatCurrency(data.balance)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expense Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Répartition des Dépenses</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {data.byCategory.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Aucune donnée de dépenses
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.byCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {data.byCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Balance Tab */}
        <TabsContent value="balance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Bilan Comptable</CardTitle>
              <Button variant="outline" onClick={handleExportBalancePDF}>
                <FileText className="h-4 w-4 mr-2" />
                Exporter PDF
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Actif */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-primary">ACTIF</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span>Caisse</span>
                      <span className="font-medium">{formatCurrency(data.balance)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Banque</span>
                      <span className="font-medium">{formatCurrency(0)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Matériel</span>
                      <span className="font-medium">{formatCurrency(data.byCategory.find(c => c.name === 'Achats de Matériel')?.value || 0)}</span>
                    </div>
                    <div className="flex justify-between py-3 bg-primary/5 rounded-lg px-3 font-bold">
                      <span>TOTAL ACTIF</span>
                      <span>{formatCurrency(data.balance + (data.byCategory.find(c => c.name === 'Achats de Matériel')?.value || 0))}</span>
                    </div>
                  </div>
                </div>

                {/* Passif */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-primary">PASSIF</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span>Capital Social</span>
                      <span className="font-medium">{formatCurrency(5000000)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Apports Associés</span>
                      <span className="font-medium">{formatCurrency(data.totalIncome)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Résultat</span>
                      <span className="font-medium text-red-600">({formatCurrency(data.totalExpenses)})</span>
                    </div>
                    <div className="flex justify-between py-3 bg-primary/5 rounded-lg px-3 font-bold">
                      <span>TOTAL PASSIF</span>
                      <span>{formatCurrency(5000000 + data.totalIncome - data.totalExpenses)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cashflow Tab */}
        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Flux de Trésorerie</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              {data.transactions.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Aucune donnée de trésorerie pour cette période
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byDepartment.filter(d => d.income > 0 || d.expenses > 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1000)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="income" name="Entrées" fill="hsl(145, 63%, 35%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Sorties" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Department Tab */}
        <TabsContent value="department">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analyse par Département</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              {data.byDepartment.filter(d => d.income > 0 || d.expenses > 0).length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Aucune donnée par département pour cette période
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byDepartment.filter(d => d.income > 0 || d.expenses > 0)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1000)}k`} />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="income" name="Entrées" fill="hsl(145, 63%, 35%)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="expenses" name="Sorties" fill="hsl(0, 72%, 51%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Reports;
