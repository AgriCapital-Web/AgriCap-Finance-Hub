import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, Calendar, FileText, Loader2, Users, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAssociates } from '@/hooks/useAssociates';
import { validateFile, sanitizeFileName, generateStructuredPath, MAX_FILE_SIZE, MIN_AMOUNT, MAX_AMOUNT } from '@/lib/validation';

const incomeSchema = z.object({
  date: z.string().min(1, 'La date est requise'),
  amount: z.string()
    .min(1, 'Le montant est requis')
    .refine((val) => {
      const num = parseFloat(val.replace(/[\s,]/g, ''));
      return !isNaN(num) && num >= MIN_AMOUNT && num <= MAX_AMOUNT;
    }, { message: `Montant invalide (min: ${MIN_AMOUNT}, max: ${MAX_AMOUNT.toLocaleString('fr-FR')} FCFA)` }),
  category: z.string().min(1, 'La catégorie est requise'),
  source: z.string().optional(),
  associate_id: z.string().optional(),
  description: z.string().optional(),
  payment_method: z.string().optional(),
  payment_provider_id: z.string().optional(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

const incomeCategories = ['Apport Associés', 'Levée de fonds', 'Vente', 'Subvention', 'Autre entrée'];

interface PaymentProvider {
  id: string;
  name: string;
  type: string;
}

interface IncomeFormProps {
  onSuccess?: () => void;
}

export const IncomeForm = ({ onSuccess }: IncomeFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAssociateField, setShowAssociateField] = useState(false);
  const [paymentProviders, setPaymentProviders] = useState<PaymentProvider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<PaymentProvider[]>([]);
  const { user } = useAuth();
  const { associates } = useAssociates();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedCategory = watch('category');
  const selectedPaymentMethod = watch('payment_method');

  // Fetch payment providers
  useEffect(() => {
    const fetchProviders = async () => {
      const { data } = await supabase
        .from('payment_providers' as any)
        .select('id, name, type')
        .eq('is_active', true)
        .order('name');
      setPaymentProviders((data as unknown as PaymentProvider[]) || []);
    };
    fetchProviders();
  }, []);

  // Filter providers based on payment method
  useEffect(() => {
    if (selectedPaymentMethod === 'mobile_money') {
      setFilteredProviders(paymentProviders.filter(p => p.type === 'mobile_money'));
    } else if (selectedPaymentMethod === 'bank' || selectedPaymentMethod === 'transfer' || selectedPaymentMethod === 'cheque') {
      setFilteredProviders(paymentProviders.filter(p => p.type === 'bank' || p.type === 'microfinance'));
    } else {
      setFilteredProviders([]);
    }
  }, [selectedPaymentMethod, paymentProviders]);

  useEffect(() => {
    setShowAssociateField(selectedCategory === 'Apport Associés');
    if (selectedCategory !== 'Apport Associés') {
      setValue('associate_id', '');
    }
  }, [selectedCategory, setValue]);

  const onSubmit = async (data: IncomeFormData) => {
    if (!user) {
      toast({ title: 'Erreur', description: 'Vous devez être connecté', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload file if present
      let filePath: string | null = null;
      if (file) {
        const structuredPath = generateStructuredPath(file.name, 'transactions');
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(structuredPath, file);
        
        if (uploadError) throw uploadError;
        filePath = structuredPath;
      }

      const amount = parseFloat(data.amount.replace(/[\s,]/g, ''));

      // Create transaction
      const { data: transaction, error } = await supabase.from('transactions').insert({
        date: data.date,
        amount: amount,
        transaction_type: 'income',
        nature: data.category,
        source: data.source || null,
        associate_id: data.associate_id || null,
        description: data.description || null,
        payment_method: (data.payment_method as any) || null,
        payment_provider_id: data.payment_provider_id || null,
        created_by: user.id,
        validation_status: 'draft',
      }).select().single();

      if (error) throw error;

      // If it's an associate contribution, also create the contribution record
      if (data.category === 'Apport Associés' && data.associate_id && transaction) {
        await supabase.from('associate_contributions').insert({
          associate_id: data.associate_id,
          amount: amount,
          contribution_date: data.date,
          contribution_type: 'capital',
          description: data.description || 'Apport au capital',
          transaction_id: transaction.id,
          created_by: user.id,
        });
      }

      // Create document record if file was uploaded
      if (filePath && transaction) {
        await supabase.from('documents').insert({
          file_name: sanitizeFileName(file!.name),
          file_path: filePath,
          file_size: file!.size,
          file_type: file!.type,
          document_type: 'justificatif',
          transaction_id: transaction.id,
          uploaded_by: user.id,
          storage_year: new Date().getFullYear(),
          storage_month: new Date().getMonth() + 1,
        });
      }

      toast({
        title: 'Entrée enregistrée',
        description: `Montant: ${amount.toLocaleString('fr-FR')} FCFA`,
      });

      reset();
      setFile(null);
      setFileError(null);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating income:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Impossible d'enregistrer l'entrée",
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validation = validateFile(selectedFile);
      
      if (!validation.valid) {
        setFileError(validation.error || 'Fichier invalide');
        setFile(null);
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const paymentMethods = [
    { value: 'cash', label: 'Espèces' },
    { value: 'bank', label: 'Banque' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'cheque', label: 'Chèque' },
    { value: 'transfer', label: 'Virement' },
  ];

  return (
    <Card className="animate-fadeIn">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-600">
            <FileText className="h-4 w-4" />
          </div>
          Nouvelle Entrée
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
                  {incomeCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>

            {/* Associate (shown only for "Apport Associés") */}
            {showAssociateField && (
              <div className="space-y-2">
                <Label htmlFor="associate_id" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Associé Fondateur
                </Label>
                <Select onValueChange={(val) => setValue('associate_id', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un associé" />
                  </SelectTrigger>
                  <SelectContent>
                    {associates.map((associate) => (
                      <SelectItem key={associate.id} value={associate.id}>
                        {associate.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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

            {/* Payment Provider (conditional) */}
            {filteredProviders.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="payment_provider_id" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  {selectedPaymentMethod === 'mobile_money' ? 'Opérateur' : 'Banque / Institution'}
                </Label>
                <Select onValueChange={(val) => setValue('payment_provider_id', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedPaymentMethod === 'mobile_money' ? "Sélectionner l'opérateur" : "Sélectionner la banque"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProviders.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Source */}
            <div className="space-y-2">
              <Label htmlFor="source">Source / Origine</Label>
              <Input
                id="source"
                placeholder="Ex: Compte principal"
                {...register('source')}
              />
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
            <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer ${fileError ? 'border-destructive' : 'border-border'}`}>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                {file ? (
                  <p className="text-sm font-medium text-foreground">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">Cliquez pour téléverser</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (max 20MB)</p>
                  </>
                )}
              </label>
            </div>
            {fileError && <p className="text-sm text-destructive">{fileError}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
            <Button type="button" variant="outline" onClick={() => { reset(); setFile(null); setFileError(null); }} disabled={isSubmitting}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};