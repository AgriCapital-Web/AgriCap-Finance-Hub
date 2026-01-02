import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useDepartments } from '@/hooks/useDepartments';
import { Upload, FileText, Search, FolderOpen, Download, Link2, CheckCircle, AlertCircle, Filter } from 'lucide-react';
import { formatDate } from '@/lib/mockData';
import { DOCUMENT_TYPES } from '@/lib/regions-ci';
import { validateFile, sanitizeFileName, MAX_FILE_SIZE } from '@/lib/validation';

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  document_type: string | null;
  transaction_id: string | null;
  uploaded_by: string | null;
  created_at: string | null;
  is_linked: boolean | null;
  user_profile_id: string | null;
  stakeholder_id: string | null;
  associate_id: string | null;
}

interface UnlinkedExpense {
  id: string;
  date: string;
  amount: number;
  description: string | null;
  nature: string | null;
}

interface PersonOption {
  id: string;
  name: string;
  type: 'user' | 'stakeholder' | 'associate';
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [unlinkedExpenses, setUnlinkedExpenses] = useState<UnlinkedExpense[]>([]);
  const [personOptions, setPersonOptions] = useState<PersonOption[]>([]);
  
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    document_type: '',
    department_id: '',
    person_id: '',
    person_type: '' as 'user' | 'stakeholder' | 'associate' | '',
    expense_id: '',
  });
  const [fileError, setFileError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { departments } = useDepartments();

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonOptions = async () => {
    const options: PersonOption[] = [];
    
    // Fetch profiles (users)
    const { data: profiles } = await supabase.from('profiles').select('id, full_name');
    profiles?.forEach(p => options.push({ id: p.id, name: p.full_name, type: 'user' }));
    
    // Fetch stakeholders
    const { data: stakeholders } = await supabase.from('stakeholders').select('id, name');
    stakeholders?.forEach(s => options.push({ id: s.id, name: s.name, type: 'stakeholder' }));
    
    // Fetch associates
    const { data: associates } = await supabase.from('associates').select('id, full_name');
    associates?.forEach(a => options.push({ id: a.id, name: a.full_name, type: 'associate' }));
    
    setPersonOptions(options);
  };

  const fetchUnlinkedExpenses = async (personId?: string, personType?: string) => {
    try {
      // Get all expense transaction IDs that already have linked documents
      const { data: linkedDocs } = await supabase
        .from('documents')
        .select('transaction_id')
        .eq('is_linked', true)
        .not('transaction_id', 'is', null);
      
      const linkedIds = linkedDocs?.map(d => d.transaction_id).filter(Boolean) || [];
      
      let query = supabase
        .from('transactions')
        .select('id, date, amount, description, nature')
        .eq('transaction_type', 'expense')
        .order('date', { ascending: false });
      
      // Filter by person if selected
      if (personId && personType === 'stakeholder') {
        query = query.eq('stakeholder_id', personId);
      } else if (personId && personType === 'associate') {
        query = query.eq('associate_id', personId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Filter out already linked expenses
      const unlinked = data?.filter(t => !linkedIds.includes(t.id)) || [];
      setUnlinkedExpenses(unlinked);
    } catch (err) {
      console.error('Error fetching unlinked expenses:', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchPersonOptions();
    fetchUnlinkedExpenses();
  }, []);

  const handlePersonChange = (personFullId: string) => {
    const [type, id] = personFullId.split('|') as ['user' | 'stakeholder' | 'associate', string];
    setUploadForm({ ...uploadForm, person_id: id, person_type: type, expense_id: '' });
    fetchUnlinkedExpenses(id, type);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validation = validateFile(selectedFile);
      
      if (!validation.valid) {
        setFileError(validation.error || 'Fichier invalide');
        setUploadForm({ ...uploadForm, file: null });
        e.target.value = '';
        return;
      }
      
      setUploadForm({ ...uploadForm, file: selectedFile });
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un fichier', variant: 'destructive' });
      return;
    }

    if (!uploadForm.document_type) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un type de document', variant: 'destructive' });
      return;
    }

    if (!uploadForm.person_id) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un utilisateur/intervenant', variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      const file = uploadForm.file;
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const safeName = sanitizeFileName(file.name);
      const filePath = `${year}/${month}/${uploadForm.document_type}/${Date.now()}_${safeName}`;

      // Upload to storage (private bucket)
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Prepare document record
      const docRecord: any = {
        file_name: safeName,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        document_type: uploadForm.document_type,
        uploaded_by: user?.id,
        storage_year: year,
        storage_month: now.getMonth() + 1,
      };

      // Link to person
      if (uploadForm.person_type === 'user') {
        docRecord.user_profile_id = uploadForm.person_id;
      } else if (uploadForm.person_type === 'stakeholder') {
        docRecord.stakeholder_id = uploadForm.person_id;
      } else if (uploadForm.person_type === 'associate') {
        docRecord.associate_id = uploadForm.person_id;
      }

      // Link to expense if selected
      if (uploadForm.expense_id) {
        docRecord.transaction_id = uploadForm.expense_id;
        docRecord.is_linked = true;
        docRecord.linked_at = new Date().toISOString();
      }

      const { error: dbError } = await supabase.from('documents').insert(docRecord);
      if (dbError) throw dbError;

      toast({ title: 'Succès', description: 'Document téléversé avec succès' });

      setIsUploadOpen(false);
      setUploadForm({ file: null, document_type: '', department_id: '', person_id: '', person_type: '', expense_id: '' });
      setFileError(null);
      fetchDocuments();
      fetchUnlinkedExpenses();
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({ title: 'Erreur', description: err.message || 'Impossible de téléverser le document', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage.from('documents').download(doc.file_path);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de télécharger le document', variant: 'destructive' });
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const linkedCount = documents.filter(d => d.is_linked).length;
  const unlinkedCount = documents.filter(d => !d.is_linked).length;

  return (
    <MainLayout title="Documents" subtitle="Justificatifs & liaisons comptables">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total documents</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Link2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Liés à une sortie</p>
                <p className="text-2xl font-bold">{linkedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Non liés</p>
                <p className="text-2xl font-bold">{unlinkedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FolderOpen className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sorties sans justificatif</p>
                <p className="text-2xl font-bold">{unlinkedExpenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Téléverser un document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Téléverser un document</DialogTitle>
              <DialogDescription>
                Rattachez un justificatif à une opération financière pour régularisation comptable.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* File Upload */}
              <div>
                <Label>Fichier *</Label>
                <div className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center ${fileError ? 'border-destructive' : 'border-border'}`}>
                  <input
                    type="file"
                    id="doc-upload"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="doc-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    {uploadForm.file ? (
                      <p className="text-sm font-medium">{uploadForm.file.name}</p>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">PDF, JPG, PNG (max 20MB)</p>
                      </>
                    )}
                  </label>
                </div>
                {fileError && <p className="text-sm text-destructive mt-1">{fileError}</p>}
              </div>

              {/* Document Type */}
              <div>
                <Label>Type de document *</Label>
                <Select
                  value={uploadForm.document_type}
                  onValueChange={(val) => setUploadForm({ ...uploadForm, document_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User/Intervenant/Associate */}
              <div>
                <Label>Utilisateur / Intervenant *</Label>
                <Select
                  value={uploadForm.person_id ? `${uploadForm.person_type}|${uploadForm.person_id}` : ''}
                  onValueChange={handlePersonChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {personOptions.map(option => (
                      <SelectItem key={`${option.type}|${option.id}`} value={`${option.type}|${option.id}`}>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {option.type === 'user' ? 'Utilisateur' : option.type === 'stakeholder' ? 'Intervenant' : 'Associé'}
                          </Badge>
                          {option.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Department */}
              <div>
                <Label>Département (optionnel)</Label>
                <Select
                  value={uploadForm.department_id}
                  onValueChange={(val) => setUploadForm({ ...uploadForm, department_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                    <SelectItem value="associates">Associés</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Linked Expense */}
              <div>
                <Label>Sortie liée (optionnel)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Sélectionnez une sortie sans justificatif pour la régulariser
                </p>
                <Select
                  value={uploadForm.expense_id}
                  onValueChange={(val) => setUploadForm({ ...uploadForm, expense_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aucune sortie liée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune</SelectItem>
                    {unlinkedExpenses.map(expense => (
                      <SelectItem key={expense.id} value={expense.id}>
                        {expense.date} - {Number(expense.amount).toLocaleString('fr-FR')} FCFA - {expense.nature || expense.description || 'Sortie'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleUpload} disabled={uploading} className="w-full">
                {uploading ? 'Téléversement...' : 'Téléverser le document'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un document..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {DOCUMENT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liste des documents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun document trouvé
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium truncate max-w-[200px]">{doc.file_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.document_type || 'Non classé'}</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                      <TableCell>
                        {doc.is_linked ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Lié
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Non lié
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{doc.created_at ? formatDate(doc.created_at) : '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
