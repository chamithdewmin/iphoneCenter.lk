import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCog, 
  Plus, 
  List, 
  ChevronDown, 
  ChevronRight,
  Search,
  Eye,
  Mail,
  Shield,
  RefreshCw,
  Save,
  X,
  Loader2,
  UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { authFetch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const Users = () => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
    branchId: '',
    phone: '',
  });

  const roles = ['admin', 'manager', 'staff', 'cashier'];
  const roleNeedsWarehouse = formData.role === 'manager' || formData.role === 'staff' || formData.role === 'cashier';

  const fetchBranches = useCallback(async () => {
    const { ok, data } = await authFetch('/api/branches');
    const list = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.branches)
        ? data.branches
        : Array.isArray(data) ? data : [];
    setBranches(list);
    if (!ok && data?.message) {
      toast({
        title: 'Could not load warehouses',
        description: data.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await authFetch('/api/users');
    setLoading(false);
    if (!ok) {
      toast({
        title: 'Could not load users',
        description: data?.message || 'Failed to load users.',
        variant: 'destructive',
      });
      setUsers([]);
      setFilteredUsers([]);
      return;
    }
    const list = Array.isArray(data?.data) ? data.data : [];
    setUsers(list);
    setFilteredUsers(list);
  }, [toast]);

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, [fetchUsers, fetchBranches]);

  useEffect(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const filtered = users.filter(u =>
        (u.full_name || u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username?.trim() || !formData.name?.trim() || !formData.email?.trim() || !formData.password) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (Username, Full Name, Email, Password)',
        variant: 'destructive',
      });
      return;
    }
    if (formData.username.trim().length < 3) {
      toast({
        title: 'Validation Error',
        description: 'Username must be at least 3 characters',
        variant: 'destructive',
      });
      return;
    }
    if (formData.password.length < 6) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }
    if (roleNeedsWarehouse) {
      if (!formData.branchId) {
        toast({
          title: 'Validation Error',
          description: 'Please select a Warehouse for Manager or Staff',
          variant: 'destructive',
        });
        return;
      }
      if (branches.length === 0) {
        toast({
          title: 'Cannot register user',
          description: 'Add at least one warehouse (Warehouses → Add Warehouse) before adding Manager or Staff.',
          variant: 'destructive',
        });
        return;
      }
    }

    setSaving(true);
    const { ok, status, data } = await authFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.name.trim(),
        role: formData.role,
        branchId: roleNeedsWarehouse && formData.branchId ? parseInt(formData.branchId, 10) : null,
      }),
    });
    setSaving(false);

    if (!ok) {
      toast({
        title: 'Could not create user',
        description: data?.message || (status === 401 ? 'Please log in again' : 'Please try again'),
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'User Added',
      description: `${formData.name} has been added and saved to the database`,
    });
    setFormData({
      username: '',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'staff',
      branchId: '',
      phone: '',
    });
    setIsAddModalOpen(false);
    fetchUsers();
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-red-500/20 text-red-600 dark:text-red-400',
      manager: 'bg-primary/20 text-primary',
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
        <title>Users - iphone center.lk</title>
        <meta name="description" content="Manage users" />
      </Helmet>

      <div className="space-y-4">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 bg-card rounded-lg border border-secondary hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <UserCog className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold text-primary">Users</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-primary" />
          ) : (
            <ChevronRight className="w-5 h-5 text-primary" />
          )}
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Action Buttons */}
              <div className="flex items-center gap-3 px-4">
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add User
                </Button>
                <Button
                  className="flex items-center gap-2 bg-primary text-primary-foreground"
                >
                  <List className="w-4 h-4" />
                  User List
                </Button>
                <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {/* Search */}
              <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm px-4">
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

              {/* Users List */}
              {loading ? (
                <div className="flex items-center justify-center py-16 px-4">
                  <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl p-12 border border-secondary text-center px-4"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserCog className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Users Found</h3>
                  <p className="text-muted-foreground mb-6">
                    {users.length === 0 
                      ? "Get started by adding your first user"
                      : "No users match your search criteria"}
                  </p>
                  {users.length === 0 && (
                    <Button onClick={() => setIsAddModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First User
                    </Button>
                  )}
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
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
                          <Link to={`/users/view/${user.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>

                        <div className="space-y-2 mb-4">
                          {user.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-muted-foreground" />
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add User Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
              <DialogDescription>
                Add a new user account to the system
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">User Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="johndoe"
                      className="mt-1"
                      minLength={3}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-0.5">Min 3 characters, used to log in</p>
                  </div>
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="user@example.com"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0771234567"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role *</Label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={(e) => {
                        handleChange(e);
                        if (e.target.value === 'admin') setFormData((prev) => ({ ...prev, branchId: '' }));
                      }}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                      required
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  {roleNeedsWarehouse && (
                    <div>
                      <Label htmlFor="branchId">Warehouse *</Label>
                      <select
                        id="branchId"
                        name="branchId"
                        value={formData.branchId}
                        onChange={handleChange}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                        required={roleNeedsWarehouse}
                      >
                        <option value="">Select warehouse</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>{b.name} {b.code ? `(${b.code})` : ''}</option>
                        ))}
                      </select>
                      {branches.length === 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          No warehouse registered. Add one in Warehouses first.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-secondary pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Security</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || (roleNeedsWarehouse && branches.length === 0)}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving…' : 'Save User'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Users;
