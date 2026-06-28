import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Shield, User as UserIcon, Search, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Badge, LoadingSpinner, EmptyState, ConfirmDialog } from '../../components/shared';
import type { User } from '../../types';

interface UserWithCooperative extends User {
  cooperative?: { id: string; name: string } | null;
}

export function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<UserWithCooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const search = searchParams.get('q') || '';
  const role = searchParams.get('role') || '';

  useEffect(() => {
    fetchUsers();
  }, [search, role]);

  const fetchUsers = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          cooperative:cooperatives(id, name)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.ilike('email', `%${search}%`);
      }

      if (role) {
        query = query.eq('role', role);
      }

      const { data, error } = await query;

      if (error) throw error;

      setUsers(data as UserWithCooperative[] || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId: deleteId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      setUsers(users.filter((u) => u.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSearch = formData.get('search') as string;

    const params = new URLSearchParams(searchParams);
    if (newSearch) {
      params.set('q', newSearch);
    } else {
      params.delete('q');
    }
    setSearchParams(params);
  };

  const handleChangeRole = async (userId: string, newRole: 'admin' | 'cooperative_user') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, role: newRole } : u
        )
      );
    } catch (err) {
      console.error('Error changing role:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Manage Users</h1>
          <p className="text-secondary-600 mt-1">{users.length} users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search by email..."
                className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
              />
            </div>
          </form>

          <select
            value={role}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) {
                params.set('role', e.target.value);
              } else {
                params.delete('role');
              }
              setSearchParams(params);
            }}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="cooperative_user">Cooperative User</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No users found"
          description="No users match your search criteria."
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-secondary-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-100">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Cooperative
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-medium text-sm">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-secondary-900">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.role === 'admin' ? 'info' : 'default'}>
                        {user.role === 'admin' ? (
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            Cooperative
                          </span>
                        )}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.cooperative ? (
                        <span className="text-secondary-600">{user.cooperative.name}</span>
                      ) : (
                        <span className="text-secondary-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user.id, e.target.value as 'admin' | 'cooperative_user')}
                          className="text-sm border border-secondary-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-200"
                        >
                          <option value="admin">Admin</option>
                          <option value="cooperative_user">Cooperative User</option>
                        </select>
                        <button
                          onClick={() => setDeleteId(user.id)}
                          className="p-2 text-secondary-400 hover:text-error-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
