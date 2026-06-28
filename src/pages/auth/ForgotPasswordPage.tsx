import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input, Button } from '../../components/shared';
import { ArrowLeft, Mail } from 'lucide-react';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: resetError } = await resetPassword(email);

    if (resetError) {
      setError(resetError);
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
            <Mail className="w-8 h-8 text-success-600" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">Check your email</h1>
          <p className="text-secondary-600 mt-2 mb-6">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-secondary-500">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={() => setSuccess(false)}
              className="text-primary-600 hover:text-primary-700"
            >
              try again
            </button>
          </p>
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
          <h1 className="text-2xl font-bold text-secondary-900">Forgot password?</h1>
          <p className="text-secondary-600 mt-2">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-secondary-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-error-50 border border-error-200 rounded-lg text-error-700 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={submitting}
            >
              Send reset link
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-secondary-100 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-secondary-600 hover:text-secondary-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
