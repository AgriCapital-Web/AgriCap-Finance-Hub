import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, Calendar, FileText, Loader2, Building2, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDepartments } from '@/hooks/useDepartments';

const expenseSchema = z.object({
  date: z.string().min(1, 'La date est requise'),
  amount: z.string().min(1, 'Le montant est requis'),
  category: z.string().min(1, 'La catégorie est requise'),
  department_id: z.string().optional(),
  stakeholder_id: z.string().optional(),
  article: z.string().min(1, "L'article est requis"),
  description: z.string().optional(),
  payment_method: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const expenseCategories = ['Carburation', 'Achats de Matériel', 'Salaires', 'Négoce', 'Fournitures', 'Services', 'Autre dépense'];
const paymentMethods = [
  { value: 'cash', label: 'Espèces' },
  { value: 'bank', label: 'Banque' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'transfer', label: 'Virement' },
];

interface ExpenseFormProps {
  onSuccess?: () => void;
}

export const ExpenseForm = ({ onSuccess }: ExpenseFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stakeholders, setStakeholders] = useState<any[]>([]);
  const { user } = useAuth();
  const { departments } = useDepartments();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    const fetchStakeholders = async () => {
      const { data } = await supabase.from('stakeholders').select('*').eq('is_active', true).order('name');
      setStakeholders(data || []);
    };
    fetchStakeholders();
  }, []);

  const onSubmit = async (data: ExpenseFormData) => {
    if (!user) {
      toast({ title: 'Erreur', description: 'Vous devez être connecté', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload file if present
      let filePath: string | null = null;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(`transactions/${fileName}`, file);
        
        if (uploadError) throw uploadError;
        filePath = `transactions/${fileName}`;
      }

      // Create transaction
      const { error } = await supabase.from('transactions').insert({
        date: data.date,
        amount: parseFloat(data.amount.replace(/\s/g, '')),
        transaction_type: 'expense',
        nature: data.category,
        department_id: data.department_id || null,
        stakeholder_id: data.stakeholder_id || null,
        description: data.article + (data.description ? ` - ${data.description}` : ''),
        payment_method: (data.payment_method as any) || null,
        created_by: user.id,
        validation_status: 'draft',
      });

      if (error) throw error;

      toast({
        title: 'Sortie enregistrée',
        description: `Montant: ${data.amount} FCFA`,
      });

      reset();
      setFile(null);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating expense:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Impossible d'enregistrer la sortie",
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Card className="animate-fadeIn">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 text-red-600">
            <FileText className="h-4 w-4" />
          </div>
          Nouvelle Sortie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
                className={errors.date ? 'border-destructive' : ''}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (FCFA)</Label>
              <Input
                id="amount"
                type="text"
                placeholder="0"
                {...register('amount')}
                className={`text-lg font-semibold ${errors.amount ? 'border-destructive' : ''}`}
              />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select onValueChange={(val) => setValue('category', val)}>
                <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>

            {/* Article */}
            <div className="space-y-2">
              <Label htmlFor="article">Article / Libellé</Label>
              <Input
                id="article"
                placeholder="Ex: Achat de matériel"
                {...register('article')}
                className={errors.article ? 'border-destructive' : ''}
              />
              {errors.article && <p className="text-sm text-destructive">{errors.article.message}</p>}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department_id" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Service / Département
              </Label>
              <Select onValueChange={(val) => setValue('department_id', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un service" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Beneficiary/Stakeholder */}
            <div className="space-y-2">
              <Label htmlFor="stakeholder_id" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Bénéficiaire / Intervenant
              </Label>
              <Select onValueChange={(val) => setValue('stakeholder_id', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un bénéficiaire" />
                </SelectTrigger>
                <SelectContent>
                  {stakeholders.map((stakeholder) => (
                    <SelectItem key={stakeholder.id} value={stakeholder.id}>
                      {stakeholder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="payment_method">Mode de paiement</Label>
              <Select onValueChange={(val) => setValue('payment_method', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un mode" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description / Commentaire</Label>
            <Textarea
              id="description"
              placeholder="Détails supplémentaires..."
              rows={3}
              {...register('description')}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Pièce justificative (Reçu / Facture)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <input
                type="file"
                id="expense-file-upload"
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleFileChange}
              />
              <label htmlFor="expense-file-upload" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                {file ? (
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">Cliquez pour téléverser</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, PDF jusqu'à 10MB</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-red-500 hover:bg-red-600"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
            <Button type="button" variant="outline" onClick={() => reset()} disabled={isSubmitting}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
