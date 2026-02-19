import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import loginBg from '@/assets/login-bg.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    const trimmedEmail = (email || '').trim();
    if (!trimmedEmail) errs.email = 'Email or username is required';
    if (!password) errs.password = 'Password is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    if (!validate()) return;
    setLoading(true);
    const result = await login((email || '').trim(), password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid email or password. Please try again.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - iphone center.lk</title>
        <meta name="description" content="Login to iphone center.lk phone shop POS system" />
      </Helmet>

      {/* Background image with overlay for readability */}
      <div
        className="relative min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})` }}
      >
        <div className="absolute inset-0 bg-black/40 z-0" aria-hidden="true" />
        <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          {/* Dark card */}
          <div className="bg-[#2d2d2d] rounded-2xl shadow-2xl p-8 space-y-6">
            {/* Brand: two-tone like MyAccounts */}
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-white">iphone</span>
                <span className="text-white"> center.lk</span>
              </h1>
              <p className="text-white/90 text-lg">Login to your Account</p>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center gap-2"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span className="text-sm text-red-300">{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">
                  Email or username
                </Label>
                <Input
                  id="email"
                  type="text"
                  autoComplete="username"
                  placeholder="hello@yourcompany.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
                  required
                  aria-required="true"
                  aria-invalid={!!fieldErrors.email}
                  className={`bg-[#1a1a1a] border-[#404040] text-white placeholder:text-gray-500 focus:border-white focus:ring-white/20 ${fieldErrors.email ? 'border-red-500' : ''}`}
                />
                {fieldErrors.email && (
                  <p className="text-sm text-red-400" role="alert">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white font-medium">
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-blue-400 hover:text-blue-300 focus:outline-none focus:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
                    required
                    aria-required="true"
                    aria-invalid={!!fieldErrors.password}
                    className={`bg-[#1a1a1a] border-[#404040] text-white placeholder:text-gray-500 pr-10 focus:border-white focus:ring-white/20 ${fieldErrors.password ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-sm text-red-400" role="alert">{fieldErrors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-primary-foreground font-medium py-2.5 rounded-lg focus:ring-primary/30 transition-colors"
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            {/* Footer like MyAccounts */}
            <div className="text-center space-y-2 pt-2">
              <p className="text-white/80 text-sm">
                New here? Demo: <span className="font-mono text-white">test</span> / <span className="font-mono text-white">test</span>
              </p>
              <p className="text-white/50 text-xs">Version: 1.0.0</p>
            </div>
          </div>
        </motion.div>
        </div>
      </div>
    </>
  );
};

export default Login;