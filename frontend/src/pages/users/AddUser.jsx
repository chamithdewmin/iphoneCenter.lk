import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Save, UserPlus, X, Shield, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const getPasswordRuleState = (password, name, username) => {
  const value = password || '';
  const lower = value.toLowerCase();
  const personalTokens = [name, username]
    .filter(Boolean)
    .map((v) => v.toLowerCase().replace(/\s+/g, ''));

  const sanitized = lower.replace(/\s+/g, '');

  const noPersonal =
    value.length > 0 && !personalTokens.some((token) => token && sanitized.includes(token));

  return {
    length: value.length >= 8,
    upper: /[A-Z]/.test(value),
    number: /\d/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value),
    noPersonal,
  };
};

const AddUser = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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

  const passwordRules = getPasswordRuleState(formData.password, formData.name, formData.username);

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

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

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
    if (formData.password.length < 8) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 8 characters',
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

    setLoading(true);
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
    setLoading(false);

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
    navigate('/users/list');
  };

  return (
    <>
      <Helmet>
        <title>Add User - iphone center.lk</title>
        <meta name="description" content="Add a new user account" />
      </Helmet>

      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Add User
          </h1>
          <p className="text-muted-foreground mt-1">Add a new user account to the system</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-card rounded-xl border border-secondary shadow-sm">
            <div className="p-6 space-y-6">
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
                      minLength={8}
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
                      minLength={8}
                      required
                    />
                  </div>
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  <div className="inline-block rounded-md border border-emerald-500/50 bg-emerald-500/5 px-3 py-2 shadow-sm">
                    <p className="font-medium flex items-center gap-2 text-foreground/80 mb-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Password must include:</span>
                    </p>
                    <ul className="space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          passwordRules.length ? 'text-emerald-500' : 'text-muted-foreground opacity-40'
                        }`}
                      />
                      <span className={passwordRules.length ? 'text-emerald-500' : 'text-muted-foreground'}>
                        Be at least 8 characters
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          passwordRules.noPersonal ? 'text-emerald-500' : 'text-muted-foreground opacity-40'
                        }`}
                      />
                      <span className={passwordRules.noPersonal ? 'text-emerald-500' : 'text-muted-foreground'}>
                        Not contain your name or username
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          passwordRules.upper ? 'text-emerald-500' : 'text-muted-foreground opacity-40'
                        }`}
                      />
                      <span className={passwordRules.upper ? 'text-emerald-500' : 'text-muted-foreground'}>
                        Include at least one uppercase letter
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          passwordRules.number ? 'text-emerald-500' : 'text-muted-foreground opacity-40'
                        }`}
                      />
                      <span className={passwordRules.number ? 'text-emerald-500' : 'text-muted-foreground'}>
                        Include at least one number
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          passwordRules.symbol ? 'text-emerald-500' : 'text-muted-foreground opacity-40'
                        }`}
                      />
                      <span className={passwordRules.symbol ? 'text-emerald-500' : 'text-muted-foreground'}>
                        Include at least one symbol
                      </span>
                    </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-secondary p-6 bg-secondary/30">
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/users/list')}
                  disabled={loading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || (roleNeedsWarehouse && branches.length === 0)}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving…' : 'Save User'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddUser;
