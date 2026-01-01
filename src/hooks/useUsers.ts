import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRole extends Profile {
  role?: AppRole;
  department_name?: string;
}

export function useUsers() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profileError) throw profileError;

      // Fetch roles
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (roleError) throw roleError;

      // Merge profiles with roles
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        role: roles?.find(r => r.user_id === profile.id)?.role,
      })) || [];

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les utilisateurs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createUser = async (
    email: string,
    password: string,
    fullName: string,
    role: AppRole,
    phone?: string,
    title?: string
  ) => {
    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || '',
            title: title || '',
          },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Utilisateur non créé');

      // Add role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role,
        });

      if (roleError) throw roleError;

      toast({
        title: 'Succès',
        description: `Utilisateur ${fullName} créé avec succès`,
      });

      await fetchUsers();
      return authData.user;
    } catch (err: any) {
      console.error('Error creating user:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de créer l\'utilisateur',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Rôle mis à jour',
      });

      await fetchUsers();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le rôle',
        variant: 'destructive',
      });
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: isActive ? 'Utilisateur activé' : 'Utilisateur désactivé',
      });

      await fetchUsers();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const roleCounts = {
    super_admin: users.filter(u => u.role === 'super_admin').length,
    admin: users.filter(u => u.role === 'admin').length,
    comptable: users.filter(u => u.role === 'comptable').length,
    raf: users.filter(u => u.role === 'raf').length,
    cabinet: users.filter(u => u.role === 'cabinet').length,
    auditeur: users.filter(u => u.role === 'auditeur').length,
  };

  return {
    users,
    loading,
    roleCounts,
    refetch: fetchUsers,
    createUser,
    updateUserRole,
    toggleUserStatus,
  };
}
