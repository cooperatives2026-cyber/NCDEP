import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input, Button } from '../../components/shared';

export function ResetPasswordPage() {
  const { updatePassword, session } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if we have a valid session from the reset link
    if (!session) {
      // If no session, the user might have landed here without a valid reset token
      // Supabase should have handled the token validation
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);

    const { error: updateError } = await updatePassword(password);

    if (updateError) {
      setError(updateError);
      setSubmitting(false);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-secondary-50 px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">Password updated</h1>
          <p className="text-secondary-600 mt-2 mb-6">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Sign in
          </Link>
        </div>
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
          <h1 className="text-2xl font-bold text-secondary-900">Reset your password</h1>
          <p className="text-secondary-600 mt-2">Enter a new password for your account</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-secondary-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-error-50 border border-error-200 rounded-lg text-error-700 text-sm">
                {error}
              </div>
            )}

            <Input
              label="New password"
              type="password"
              placeholder="Enter new password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              helperText="Must be at least 6 characters"
            />

            <Input
              label="Confirm password"
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={submitting}
            >
              Update password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
