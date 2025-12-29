import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Send, CheckCircle, XCircle, Lock, Clock, ArrowRight, History, Loader2 } from 'lucide-react';
import { ValidationStatus, validationStatusLabels } from '@/types';
import { formatDate } from '@/lib/mockData';
import type { Database } from '@/integrations/supabase/types';

type ValidationRecord = Database['public']['Tables']['validations']['Row'];

interface ValidationWorkflowProps {
  transactionId: string;
  currentStatus: ValidationStatus;
  onStatusChange?: () => void;
  validations?: ValidationRecord[];
}

export function ValidationWorkflow({ 
  transactionId, 
  currentStatus, 
  onStatusChange,
  validations = []
}: ValidationWorkflowProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, role } = useAuth();

  const canSubmit = currentStatus === 'draft';
  const canValidateRAF = (role === 'raf' || role === 'super_admin' || role === 'admin') && currentStatus === 'submitted';
  const canValidateDG = (role === 'super_admin') && currentStatus === 'raf_validated';
  const canLock = (role === 'super_admin' || role === 'admin') && currentStatus === 'dg_validated';
  const canReject = (role === 'raf' || role === 'super_admin' || role === 'admin') && 
                   ['submitted', 'raf_validated'].includes(currentStatus);

  const getNextStatus = (): ValidationStatus => {
    switch (currentStatus) {
      case 'draft': return 'submitted';
      case 'submitted': return 'raf_validated';
      case 'raf_validated': return 'dg_validated';
      case 'dg_validated': return 'locked';
      default: return currentStatus;
    }
  };

  const handleAction = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const newStatus: ValidationStatus = action === 'reject' ? 'rejected' : getNextStatus();

      // Update transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ validation_status: newStatus })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      // Create validation record
      const { error: validationError } = await supabase
        .from('validations')
        .insert({
          transaction_id: transactionId,
          from_status: currentStatus,
          to_status: newStatus,
          validated_by: user.id,
          comment: comment || null,
        });

      if (validationError) throw validationError;

      toast({
        title: action === 'reject' ? 'Transaction rejetée' : 'Statut mis à jour',
        description: `Nouveau statut: ${validationStatusLabels[newStatus].label}`,
      });

      setShowConfirm(false);
      setComment('');
      setAction(null);
      onStatusChange?.();
    } catch (error: any) {
      console.error('Validation error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openConfirm = (actionType: 'approve' | 'reject') => {
    setAction(actionType);
    setShowConfirm(true);
  };

  const statusConfig = validationStatusLabels[currentStatus];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Workflow de validation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Statut actuel</span>
          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
        </div>

        {/* Workflow Steps */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {['draft', 'submitted', 'raf_validated', 'dg_validated', 'locked'].map((status, idx) => {
            const isActive = status === currentStatus;
            const isPast = ['draft', 'submitted', 'raf_validated', 'dg_validated', 'locked'].indexOf(currentStatus) > idx;
            return (
              <div key={status} className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  isActive ? 'bg-primary text-primary-foreground' :
                  isPast ? 'bg-green-500 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {isPast ? <CheckCircle className="h-3 w-3" /> : idx + 1}
                </div>
                {idx < 4 && <ArrowRight className="h-4 w-4 mx-1 text-muted-foreground" />}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {canSubmit && (
            <Button size="sm" onClick={() => openConfirm('approve')} className="gap-2">
              <Send className="h-4 w-4" />
              Soumettre
            </Button>
          )}
          {canValidateRAF && (
            <Button size="sm" onClick={() => openConfirm('approve')} className="gap-2 bg-yellow-500 hover:bg-yellow-600">
              <CheckCircle className="h-4 w-4" />
              Valider (RAF)
            </Button>
          )}
          {canValidateDG && (
            <Button size="sm" onClick={() => openConfirm('approve')} className="gap-2 bg-green-500 hover:bg-green-600">
              <CheckCircle className="h-4 w-4" />
              Valider (DG)
            </Button>
          )}
          {canLock && (
            <Button size="sm" onClick={() => openConfirm('approve')} className="gap-2 bg-purple-500 hover:bg-purple-600">
              <Lock className="h-4 w-4" />
              Verrouiller
            </Button>
          )}
          {canReject && (
            <Button size="sm" variant="destructive" onClick={() => openConfirm('reject')} className="gap-2">
              <XCircle className="h-4 w-4" />
              Rejeter
            </Button>
          )}
          {currentStatus === 'locked' && (
            <Badge variant="outline" className="gap-2 py-2">
              <Lock className="h-4 w-4" />
              Transaction verrouillée
            </Badge>
          )}
          {currentStatus === 'rejected' && (
            <Badge variant="destructive" className="gap-2 py-2">
              <XCircle className="h-4 w-4" />
              Transaction rejetée
            </Badge>
          )}
        </div>

        {/* Validation History */}
        {validations.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historique des validations
            </h4>
            <div className="space-y-2">
              {validations.map((v) => (
                <div key={v.id} className="text-xs p-2 bg-muted/30 rounded flex justify-between items-start">
                  <div>
                    <span className="font-medium">
                      {validationStatusLabels[v.from_status as ValidationStatus]?.label || v.from_status}
                    </span>
                    <ArrowRight className="inline h-3 w-3 mx-1" />
                    <span className="font-medium">
                      {validationStatusLabels[v.to_status as ValidationStatus]?.label || v.to_status}
                    </span>
                    {v.comment && <p className="text-muted-foreground mt-1">{v.comment}</p>}
                  </div>
                  <span className="text-muted-foreground">{formatDate(v.created_at || '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {action === 'reject' ? 'Rejeter la transaction' : 'Confirmer l\'action'}
              </DialogTitle>
              <DialogDescription>
                {action === 'reject' 
                  ? 'Êtes-vous sûr de vouloir rejeter cette transaction ?'
                  : `Vous allez passer la transaction au statut "${validationStatusLabels[getNextStatus()].label}"`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="comment">Commentaire (optionnel)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isLoading}>
                Annuler
              </Button>
              <Button
                onClick={handleAction}
                disabled={isLoading}
                variant={action === 'reject' ? 'destructive' : 'default'}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
