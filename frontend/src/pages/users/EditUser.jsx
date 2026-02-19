import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Save, X, Shield } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import Loading from '@/components/Loading';

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
    isActive: true,
  });

  const roles = ['admin', 'manager', 'staff'];

  useEffect(() => {
    const fetchUser = async () => {
      const { ok, data } = await authFetch(`/api/users/${id}`);
      setLoading(false);
      if (!ok || !data?.data) {
        toast({ title: 'Error', description: data?.message || 'User not found', variant: 'destructive' });
        navigate('/users/list');
        return;
      }
      const u = data.data;
      setFormData({
        username: u.username || '',
        name: u.full_name || '',
        email: u.email || '',
        password: '',
        confirmPassword: '',
        role: u.role || 'staff',
        isActive: u.is_active !== false,
      });
    };
    if (id) fetchUser();
  }, [id, navigate, toast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
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
      isActive: formData.isActive,
    };
    if (formData.password?.trim()) body.password = formData.password;

    const { ok, status, data } = await authFetch(`/api/users/${id}`, {
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

    toast({ title: 'User updated', description: 'Changes have been saved to the database.' });
    navigate('/users/list');
  };

  if (loading) {
    return <Loading fullScreen={true} />;
  }

  return (
    <>
      <Helmet>
        <title>Edit User - iphone center.lk</title>
        <meta name="description" content="Edit user account" />
      </Helmet>

      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Edit User
          </h1>
          <p className="text-muted-foreground mt-1">Update user details (saved to database)</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-card rounded-xl border border-secondary shadow-sm">
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">User information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Full name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role *</Label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm mt-1"
                      required
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="rounded border-input"
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>
              </div>

              <div className="border-t border-secondary pt-6">
                <h2 className="text-xl font-semibold mb-4">Change password (optional)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="password">New password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm new password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-secondary p-6 bg-secondary/30 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/users/list')} disabled={saving}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditUser;
