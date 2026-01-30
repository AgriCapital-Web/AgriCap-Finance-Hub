import { supabase } from '@/integrations/supabase/client';

interface CreateUserParams {
  email: string;
  password: string;
  full_name: string;
  role: string;
  phone?: string;
  title?: string;
}

export async function createUserViaAdmin(params: CreateUserParams) {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    throw new Error('Non authentifié');
  }

  const response = await supabase.functions.invoke('admin-manage-users', {
    body: {
      action: 'create',
      ...params,
    },
  });

  if (response.error) {
    throw new Error(response.error.message || 'Erreur lors de la création');
  }

  if (response.data?.error) {
    throw new Error(response.data.error);
  }

  return response.data;
}

export async function updateUserRoleViaAdmin(userId: string, role: string) {
  const response = await supabase.functions.invoke('admin-manage-users', {
    body: {
      action: 'update_role',
      user_id: userId,
      role,
    },
  });

  if (response.error) {
    throw new Error(response.error.message || 'Erreur lors de la mise à jour');
  }

  if (response.data?.error) {
    throw new Error(response.data.error);
  }

  return response.data;
}

export async function toggleUserStatusViaAdmin(userId: string, isActive: boolean) {
  const response = await supabase.functions.invoke('admin-manage-users', {
    body: {
      action: 'toggle_status',
      user_id: userId,
      is_active: isActive,
    },
  });

  if (response.error) {
    throw new Error(response.error.message || 'Erreur lors de la mise à jour');
  }

  if (response.data?.error) {
    throw new Error(response.data.error);
  }

  return response.data;
}
