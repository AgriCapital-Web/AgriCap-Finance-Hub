import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type AppRole = Database['public']['Enums']['app_role'];

export interface UserWithRole extends Profile {
  role?: AppRole;
}

export function useProfiles() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*').order('full_name');
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase.from('user_roles').select('*');
      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        return { ...profile, role: userRole?.role || undefined };
      }) || [];

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast({ title: 'Erreur', description: 'Impossible de charger les utilisateurs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (id: string, updates: Partial<Profile>) => {
    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', id);
      if (error) throw error;
      toast({ title: 'Succès', description: 'Profil mis à jour' });
      fetchUsers();
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le profil', variant: 'destructive' });
      throw err;
    }
  };

  const updateRole = async (userId: string, role: AppRole) => {
    try {
      const { data: existingRole } = await supabase.from('user_roles').select('*').eq('user_id', userId).single();

      if (existingRole) {
        const { error } = await supabase.from('user_roles').update({ role }).eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_roles').insert([{ user_id: userId, role }]);
        if (error) throw error;
      }

      toast({ title: 'Succès', description: 'Rôle mis à jour' });
      fetchUsers();
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le rôle', variant: 'destructive' });
      throw err;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, refetch: fetchUsers, updateProfile, updateRole };
}