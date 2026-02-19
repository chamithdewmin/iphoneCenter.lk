import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  UserCog, 
  Plus, 
  List, 
  Search,
  Eye,
  Mail,
  Shield,
  RefreshCw,
  Save,
  X,
  Loader2,
  UserPlus,
  Trash2,
  Pencil
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authFetch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import DataTable from '@/components/DataTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const Users = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const paginatedIds = paginatedUsers.map((u) => u.id);
    const allSelected = paginatedIds.every(id => selected.includes(id));
    
    if (allSelected) {
      // Deselect all on current page
      setSelected(selected.filter(id => !paginatedIds.includes(id)));
    } else {
      // Select all on current page
      setSelected([...new Set([...selected, ...paginatedIds])]);
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Are you sure you want to delete ${user.full_name || user.username}?`)) return;
    
    const { ok, data } = await authFetch(`/api/users/${user.id}`, {
      method: 'DELETE',
    });
    
    if (ok) {
      toast({
        title: 'User deleted',
        description: 'User has been deleted successfully.',
      });
      fetchUsers();
      setSelected(selected.filter(id => id !== user.id));
    } else {
      toast({
        title: 'Error',
        description: data?.message || 'Failed to delete user.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (user) => {
    navigate(`/users/edit/${user.id}`);
  };

  const handleView = (user) => {
    navigate(`/users/view/${user.id}`);
  };

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-xs">
            {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-foreground font-medium text-sm">{user.full_name || user.username || 'Unknown User'}</div>
            <div className="text-muted-foreground text-xs">@{user.username}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (user) => (
        <span className={`inline-flex items-center gap-1.5 bg-secondary border border-secondary text-green-400 text-xs font-medium px-2.5 py-1 rounded-full ${
          user.is_active === false ? 'text-gray-400' : ''
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${user.is_active === false ? 'bg-gray-400' : 'bg-green-400 animate-pulse'}`} />
          {user.is_active !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (user) => getRoleBadge(user.role),
    },
    {
      key: 'email',
      label: 'Email address',
      render: (user) => <span className="text-muted-foreground text-sm">{user.email || '—'}</span>,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Users - iphone center.lk</title>
        <meta name="description" content="Manage users" />
      </Helmet>

      <div className="space-y-4">
        {/* Action Buttons - Top Right */}
        <div className="flex items-center justify-end gap-3">
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
        
        <div className="space-y-4">

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

          {/* Users Table */}
          <DataTable
            title="Team members"
            count={filteredUsers.length}
            data={paginatedUsers}
            columns={columns}
            selected={selected}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            loading={loading}
            emptyMessage={users.length === 0 
              ? "Get started by adding your first user"
              : "No users match your search criteria"}
            emptyIcon={UserCog}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            getRowId={(user) => user.id}
          />
        </div>

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
