import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  UserCog, 
  Plus, 
  Search,
  Eye,
  Mail,
  Shield,
  RefreshCw,
  Save,
  X,
  UserPlus,
  Trash2,
  Pencil,
  Calendar,
  User
} from 'lucide-react';
import Loading from '@/components/Loading';
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
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
        phone: formData.phone || null,
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
      manager: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
      staff: 'bg-green-500/20 text-green-600 dark:text-green-400',
      cashier: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    };
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${styles[role] || 'bg-secondary text-secondary-foreground'}`}>
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

  const handleEdit = async (user) => {
    setLoadingUser(true);
    const { ok, data } = await authFetch(`/api/users/${user.id}`);
    setLoadingUser(false);
    if (ok && data?.data) {
      const u = data.data;
      setFormData({
        username: u.username || '',
        name: u.full_name || '',
        email: u.email || '',
        password: '',
        confirmPassword: '',
        role: u.role || 'staff',
        branchId: u.branch_id || '',
        phone: u.phone || '',
      });
      setSelectedUser(u);
      setIsEditModalOpen(true);
    } else {
      toast({
        title: 'Error',
        description: data?.message || 'Failed to load user',
        variant: 'destructive',
      });
    }
  };

  const handleView = async (user) => {
    setLoadingUser(true);
    const { ok, data } = await authFetch(`/api/users/${user.id}`);
    setLoadingUser(false);
    if (ok && data?.data) {
      setSelectedUser(data.data);
      setIsViewModalOpen(true);
    } else {
      toast({
        title: 'Error',
        description: data?.message || 'Failed to load user',
        variant: 'destructive',
      });
    }
  };

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full icon-circle-gradient flex items-center justify-center text-white font-bold text-xs">
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
    {
      key: 'branch',
      label: 'Branch',
      render: (user) => <span className="text-muted-foreground text-sm">{user.branch_name || user.branch_code || '—'}</span>,
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
            title="Active users"
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

        {/* View User Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>View User</DialogTitle>
              <DialogDescription>
                User details
              </DialogDescription>
            </DialogHeader>
            {loadingUser ? (
              <Loading text={null} fullScreen={false} />
            ) : selectedUser ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 icon-circle-gradient rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {(selectedUser.full_name || selectedUser.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedUser.full_name || selectedUser.username || 'Unknown'}</h2>
                    <p className="text-muted-foreground">@{selectedUser.username} · ID: {selectedUser.id}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedUser.email || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Role</p>
                      {getRoleBadge(selectedUser.role)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-medium">{selectedUser.is_active !== false ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                  {selectedUser.last_login && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Last login</p>
                        <p className="font-medium">{new Date(selectedUser.last_login).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setIsViewModalOpen(false);
                    handleEdit(selectedUser);
                  }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit User
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-destructive">User not found</p>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user account details
              </DialogDescription>
            </DialogHeader>
            {loadingUser ? (
              <Loading text={null} fullScreen={false} />
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!formData.username?.trim() || !formData.name?.trim() || !formData.email?.trim()) {
                  toast({
                    title: 'Validation Error',
                    description: 'Username, Full Name, and Email are required',
                    variant: 'destructive',
                  });
                  return;
                }
                if (formData.password && formData.password.length < 6) {
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

                setSaving(true);
                const body = {
                  username: formData.username.trim(),
                  email: formData.email.trim(),
                  fullName: formData.name.trim(),
                  role: formData.role,
                  branchId: formData.branchId || null,
                  phone: formData.phone || '',
                };
                if (formData.password?.trim()) body.password = formData.password;

                const { ok, status, data } = await authFetch(`/api/users/${selectedUser.id}`, {
                  method: 'PUT',
                  body: JSON.stringify(body),
                });
                setSaving(false);

                if (!ok) {
                  toast({
                    title: 'Update failed',
                    description: data?.message || (status === 401 ? 'Please log in again' : 'Please try again'),
                    variant: 'destructive',
                  });
                  return;
                }

                toast({ title: 'User updated', description: 'Changes have been saved.' });
                setIsEditModalOpen(false);
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
                setSelectedUser(null);
                fetchUsers();
              }} className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <UserPlus className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">User Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-username">Username *</Label>
                      <Input
                        id="edit-username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="johndoe"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-name">Full Name *</Label>
                      <Input
                        id="edit-name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-email">Email Address *</Label>
                      <Input
                        id="edit-email"
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
                      <Label htmlFor="edit-phone">Phone Number</Label>
                      <Input
                        id="edit-phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+94 77 123 4567"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-role">Role *</Label>
                      <select
                        id="edit-role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                        required
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    {roleNeedsWarehouse && (
                      <div>
                        <Label htmlFor="edit-branchId">Branch/Warehouse</Label>
                        <select
                          id="edit-branchId"
                          name="branchId"
                          value={formData.branchId}
                          onChange={handleChange}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                        >
                          <option value="">Select branch</option>
                          {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                              {branch.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
                      <Input
                        id="edit-password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter new password"
                        className="mt-1"
                      />
                    </div>
                    {formData.password && (
                      <div>
                        <Label htmlFor="edit-confirmPassword">Confirm New Password</Label>
                        <Input
                          id="edit-confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm new password"
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsEditModalOpen(false);
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
                    setSelectedUser(null);
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Users;
