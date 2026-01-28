import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, User, Phone, Mail, MapPin, Users, Calendar, FileText, Loader2 } from 'lucide-react';

interface AssociateFormData {
  id?: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  entry_date: string;
  notes: string;
  photo_url: string;
  contact_person_name: string;
  contact_person_phone: string;
}

interface AssociateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  associate?: AssociateFormData | null;
  onSuccess: () => void;
  userId?: string;
}

const initialFormData: AssociateFormData = {
  full_name: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  entry_date: new Date().toISOString().split('T')[0],
  notes: '',
  photo_url: '',
  contact_person_name: '',
  contact_person_phone: '',
};

export function AssociateForm({ open, onOpenChange, associate, onSuccess, userId }: AssociateFormProps) {
  const [formData, setFormData] = useState<AssociateFormData>(associate || initialFormData);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isEditing = !!associate?.id;

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une image',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erreur',
        description: 'L\'image ne doit pas dépasser 5 Mo',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `associate-${Date.now()}.${fileExt}`;
      const filePath = `associates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setFormData({ ...formData, photo_url: publicUrl });
      toast({
        title: 'Succès',
        description: 'Photo uploadée avec succès',
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'uploader la photo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.full_name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom complet est requis',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        full_name: formData.full_name.trim(),
        first_name: formData.first_name.trim() || null,
        last_name: formData.last_name.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        entry_date: formData.entry_date,
        notes: formData.notes.trim() || null,
        photo_url: formData.photo_url || null,
        contact_person_name: formData.contact_person_name.trim() || null,
        contact_person_phone: formData.contact_person_phone.trim() || null,
      };

      if (isEditing && associate?.id) {
        const { error } = await supabase
          .from('associates')
          .update(dataToSave)
          .eq('id', associate.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Associé modifié avec succès',
        });
      } else {
        const { error } = await supabase
          .from('associates')
          .insert({
            ...dataToSave,
            created_by: userId,
          });

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Associé ajouté avec succès',
        });
      }

      onSuccess();
      onOpenChange(false);
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error saving associate:', error);
      toast({
        title: 'Erreur',
        description: isEditing ? 'Impossible de modifier l\'associé' : 'Impossible d\'ajouter l\'associé',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const first = formData.first_name?.charAt(0) || formData.full_name?.charAt(0) || '';
    const last = formData.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'AS';
  };

  // Reset form when dialog opens with new data
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && associate) {
      setFormData(associate);
    } else if (!newOpen) {
      setFormData(initialFormData);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier l\'associé' : 'Nouvel associé'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifiez les informations de l\'associé' : 'Enregistrez un nouvel associé dans le système'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="personal" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Informations</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="emergency">Urgence</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 mt-4">
            {/* Photo Upload */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={formData.photo_url} alt={formData.full_name} />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Camera className="h-3 w-3" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Photo de l'associé</p>
                <p className="text-xs text-muted-foreground">
                  Cliquez sur l'icône pour changer la photo (max 5 Mo)
                </p>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="last_name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Nom
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="KOFFI"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="first_name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Prénom
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Inocent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Nom complet *
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="KOFFI Inocent"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Domicile
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Cocody Riviera 2, Abidjan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Date d'entrée
              </Label>
              <Input
                id="entry_date"
                type="date"
                value={formData.entry_date}
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
              />
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Téléphone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+225 07 XX XX XX XX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="associe@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informations complémentaires sur l'associé..."
                rows={4}
              />
            </div>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-4 mt-4">
            <div className="p-4 bg-muted/50 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-primary" />
                Personne à contacter en cas d'urgence
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ces informations seront utilisées pour contacter un proche en cas de besoin
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person_name" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Nom de la personne
              </Label>
              <Input
                id="contact_person_name"
                value={formData.contact_person_name}
                onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                placeholder="KOUAME Marie"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person_phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Téléphone de la personne
              </Label>
              <Input
                id="contact_person_phone"
                value={formData.contact_person_phone}
                onChange={(e) => setFormData({ ...formData, contact_person_phone: e.target.value })}
                placeholder="+225 05 XX XX XX XX"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Modifier' : 'Ajouter'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
