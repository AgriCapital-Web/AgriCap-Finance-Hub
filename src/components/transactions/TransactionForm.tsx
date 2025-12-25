import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, Calendar, User, Building2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { categories, departments, mockUsers } from '@/lib/mockData';
import { TransactionType } from '@/types';

const transactionSchema = z.object({
  date: z.string().min(1, 'La date est requise'),
  amount: z.string().min(1, 'Le montant est requis').refine(val => !isNaN(Number(val.replace(/\s/g, ''))) && Number(val.replace(/\s/g, '')) > 0, 'Montant invalide'),
  category: z.string().min(1, 'La catégorie est requise'),
  service: z.string().min(1, 'Le service est requis'),
  user: z.string().min(1, 'L\'utilisateur est requis'),
  article: z.string().min(1, 'L\'article est requis'),
  description: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  type: TransactionType;
}

export const TransactionForm = ({ type }: TransactionFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  const isIncome = type === 'income';

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = (data: TransactionFormData) => {
    console.log('Transaction data:', { ...data, type, file });
    toast({
      title: isIncome ? 'Entrée enregistrée' : 'Sortie enregistrée',
      description: `${data.article} - ${data.amount} FCFA`,
    });
    reset();
    setFile(null);
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
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
            <FileText className="h-4 w-4" />
          </div>
          {isIncome ? 'Nouvelle Entrée' : 'Nouvelle Sortie'}
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
                  {(isIncome ? categories.income : categories.expense).map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>

            {/* Service */}
            <div className="space-y-2">
              <Label htmlFor="service" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Service / Département
              </Label>
              <Select onValueChange={(val) => setValue('service', val)}>
                <SelectTrigger className={errors.service ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Sélectionner un service" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service && <p className="text-sm text-destructive">{errors.service.message}</p>}
            </div>

            {/* User */}
            <div className="space-y-2">
              <Label htmlFor="user" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Utilisateur
              </Label>
              <Select onValueChange={(val) => setValue('user', val)}>
                <SelectTrigger className={errors.user ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.map((user) => (
                    <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.user && <p className="text-sm text-destructive">{errors.user.message}</p>}
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
                id="file-upload"
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
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
              className={`flex-1 ${isIncome ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
            >
              Enregistrer
            </Button>
            <Button type="button" variant="outline" onClick={() => reset()}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
