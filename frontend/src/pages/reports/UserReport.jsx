import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, User, Shield, CheckCircle, Clock, LogIn, LogOut, Calendar } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';

const UserReport = () => {
  const [users, setUsers] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [roleBreakdown, setRoleBreakdown] = useState({});
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showAllLogs, setShowAllLogs] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { ok, data } = await authFetch('/api/users');
      if (cancelled) return;
      setLoading(false);
      const list = ok && Array.isArray(data?.data) ? data.data : [];
      setUsers(list);
      const breakdown = {};
      list.forEach(user => {
        const role = user.role || 'cashier';
        breakdown[role] = (breakdown[role] || 0) + 1;
      });
      setRoleBreakdown(breakdown);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLogsLoading(true);
      const url = showAllLogs 
        ? '/api/users/login-logs/all' 
        : `/api/users/${selectedUserId}/login-logs`;
      const { ok, data } = await authFetch(url);
      if (cancelled) return;
      setLogsLoading(false);
      if (ok && Array.isArray(data?.data)) {
        setLoginLogs(data.data);
      } else {
        setLoginLogs([]);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedUserId, showAllLogs]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const handleExport = () => {
    toast({
      title: "Export Successful",
      description: "User report exported successfully",
    });
  };

  const activeSessions = loginLogs.filter(log => !log.logout_time).length;
  const totalSessions = loginLogs.length;

  return (
    <>
      <Helmet>
        <title>User Report - iphone center.lk</title>
        <meta name="description" content="View user analytics and login/logout history" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              User Report
            </h1>
            <p className="text-muted-foreground mt-1">View user analytics and login/logout tracking</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {loading && (
          <p className="text-muted-foreground">Loading users…</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <User className="w-8 h-8 text-primary opacity-50" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Users</p>
                <p className="text-2xl font-bold text-green-500">
                  {users.filter(u => u.is_active !== false).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Sessions</p>
                <p className="text-2xl font-bold text-blue-500">{activeSessions}</p>
              </div>
              <LogIn className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Sessions</p>
                <p className="text-2xl font-bold">{totalSessions}</p>
              </div>
              <Clock className="w-8 h-8 text-primary opacity-50" />
            </div>
          </motion.div>
        </div>

        {Object.keys(roleBreakdown).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">Users by Role</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(roleBreakdown).map(([role, count]) => (
                <div key={role} className="p-4 border border-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1 capitalize">{role}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Login/Logout History Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold">Login/Logout History</h2>
            <div className="flex gap-3 items-center">
              <select
                className="px-3 py-2 bg-secondary border border-secondary rounded-lg text-sm"
                value={showAllLogs ? 'all' : selectedUserId || ''}
                onChange={(e) => {
                  if (e.target.value === 'all') {
                    setShowAllLogs(true);
                    setSelectedUserId(null);
                  } else {
                    setShowAllLogs(false);
                    setSelectedUserId(e.target.value);
                  }
                }}
              >
                <option value="all">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.username} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {logsLoading ? (
            <p className="text-muted-foreground">Loading login logs…</p>
          ) : loginLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No login logs found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Login Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Logout Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Duration</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">IP Address</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loginLogs.map((log, index) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-secondary hover:bg-secondary/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium">{log.full_name || log.username}</p>
                          <p className="text-xs text-muted-foreground">{log.email} • {log.role}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <LogIn className="w-4 h-4 text-green-500" />
                          {formatDate(log.login_time)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {log.logout_time ? (
                          <div className="flex items-center gap-2">
                            <LogOut className="w-4 h-4 text-red-500" />
                            {formatDate(log.logout_time)}
                          </div>
                        ) : (
                          <span className="text-yellow-500">Active Session</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.logout_time ? (
                          formatDuration(log.session_duration_seconds)
                        ) : (
                          <span className="text-blue-500">Ongoing</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {log.ip_address || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            log.logout_time
                              ? 'bg-gray-500/20 text-gray-400'
                              : 'bg-green-500/20 text-green-500'
                          }`}
                        >
                          {log.logout_time ? 'Completed' : 'Active'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default UserReport;
