import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input, Button } from '../../components/shared';
import { ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, user, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate(isAdmin ? '/admin' : '/dashboard');
    }
  }, [user, isAdmin, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">N</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-secondary-900">Welcome back</h1>
          <p className="text-secondary-600 mt-2">Sign in to your account to continue</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-secondary-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-error-50 border border-error-200 rounded-lg text-error-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-secondary-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={submitting}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Sign in
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-secondary-100 text-center">
            <p className="text-sm text-secondary-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
