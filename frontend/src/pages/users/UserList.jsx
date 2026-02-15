import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Plus, Eye, Mail, Shield, User, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authFetch } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const UserList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    const { ok, data } = await authFetch('/api/users');
    setLoading(false);
    if (!ok) {
      setError(data?.message || 'Failed to load users. Please log in again.');
      setUsers([]);
      setFilteredUsers([]);
      return;
    }
    const list = Array.isArray(data?.data) ? data.data : [];
    setUsers(list);
    setFilteredUsers(list);
    try { localStorage.removeItem('users'); } catch (_) {}
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const filtered = users.filter(user =>
        (user.full_name || user.username || '').toLowerCase().includes(searchLower) ||
        (user.email || '').toLowerCase().includes(searchLower) ||
        (user.role || '').toLowerCase().includes(searchLower)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.full_name || user.username}"? This cannot be undone.`)) return;
    setDeletingId(user.id);
    const { ok, data } = await authFetch(`/api/users/${user.id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (!ok) {
      toast({
        title: 'Delete failed',
        description: data?.message || 'Could not delete user',
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'User deleted', description: 'User has been removed from the database.' });
    fetchUsers();
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-red-500/20 text-red-600 dark:text-red-400',
      manager: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      staff: 'bg-green-500/20 text-green-600 dark:text-green-400',
      cashier: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[role] || 'bg-secondary text-secondary-foreground'}`}>
        {role?.charAt(0).toUpperCase() + role?.slice(1) || '—'}
      </span>
    );
  };

  return (
    <>
      <Helmet>
        <title>User List - iphone center.lk</title>
        <meta name="description" content="View all users" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              User List
            </h1>
            <p className="text-muted-foreground mt-1">View and manage all system users</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/users/add">
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        {loading ? (
          <div className="bg-card rounded-xl p-12 border border-secondary text-center">
            <RefreshCw className="w-12 h-12 mx-auto text-muted-foreground mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading users from database…</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <User className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Users Found</h3>
            <p className="text-muted-foreground mb-6">
              {users.length === 0
                ? 'Users are stored in the database. Add your first user or log in as admin.'
                : 'No users match your search criteria.'}
            </p>
            {users.length === 0 && (
              <Link to="/users/add">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First User
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-card rounded-xl border border-secondary overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{user.full_name || user.username || 'Unknown User'}</h3>
                        <p className="text-xs text-muted-foreground">@{user.username} · ID: {user.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-background">
                      <Button size="icon" variant="ghost" className="h-8 w-8" asChild title="View">
                        <Link to={`/users/view/${user.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" asChild title="Edit">
                        <Link to={`/users/edit/${user.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(user)}
                        disabled={deletingId === user.id}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {user.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground truncate">{user.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-secondary flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      {getRoleBadge(user.role)}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.is_active !== false
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                    }`}>
                      {user.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default UserList;
