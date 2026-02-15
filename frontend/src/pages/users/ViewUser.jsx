import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, User, Calendar } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

const ViewUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { ok, data } = await authFetch(`/api/users/${id}`);
      setLoading(false);
      if (!ok) {
        setError(data?.message || 'User not found');
        return;
      }
      setUser(data?.data || null);
    };
    if (id) fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading user…</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error || 'User not found'}</p>
        <Button variant="outline" onClick={() => navigate('/users/list')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to list
        </Button>
      </div>
    );
  }

  const roleStyles = {
    admin: 'bg-red-500/20 text-red-600 dark:text-red-400',
    manager: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    staff: 'bg-green-500/20 text-green-600 dark:text-green-400',
    cashier: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  };

  return (
    <>
      <Helmet>
        <title>View User - iphone center.lk</title>
        <meta name="description" content="View user details" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/users/list">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to list
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/users/edit/${user.id}`}>Edit user</Link>
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-secondary shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.full_name || user.username || 'Unknown'}</h1>
                <p className="text-muted-foreground">@{user.username} · ID: {user.id}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Role</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-sm font-semibold ${roleStyles[user.role] || 'bg-secondary'}`}>
                    {(user.role || '').charAt(0).toUpperCase() + (user.role || '').slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium">{user.is_active !== false ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              {(user.created_at || user.last_login) && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Last login</p>
                    <p className="font-medium">{user.last_login ? new Date(user.last_login).toLocaleString() : '—'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewUser;
