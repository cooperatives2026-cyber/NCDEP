import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Menu, X, Building2, Package, Home, LogIn, LogOut, LayoutDashboard, Calendar, Briefcase, Users, Store, Truck } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-white border-b border-secondary-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-secondary-900">NCDEP</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Home
              </span>
            </Link>
            <Link
              to="/cooperatives"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/cooperatives') ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Cooperatives
              </span>
            </Link>
            <Link
              to="/products"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/products') ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Products
              </span>
            </Link>
            <Link
              to="/events"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/events') ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Events
              </span>
            </Link>
            <Link
              to="/opportunities"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/opportunities') ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Opportunities
              </span>
            </Link>
            <Link
              to="/buyers"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/buyers') ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Buyers
              </span>
            </Link>
            <Link
              to="/retail"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/retail') ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                Retail
              </span>
            </Link>
            <Link
              to="/distribution"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/distribution') ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Distribution
              </span>
            </Link>

            {user && (
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard')
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </span>
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="text-secondary-500">Signed in as</span>
                  <span className="ml-1 font-medium text-secondary-900">{user.email.split('@')[0]}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-sm font-medium text-secondary-600 hover:text-secondary-900"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-secondary-600 hover:text-secondary-900"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-secondary-600 hover:bg-secondary-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-secondary-100">
          <div className="px-4 py-3 space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                isActive('/') ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Home
              </span>
            </Link>
            <Link
              to="/cooperatives"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                isActive('/cooperatives') ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Cooperatives
              </span>
            </Link>
            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                isActive('/products') ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Products
              </span>
            </Link>
            <Link
              to="/events"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                isActive('/events') ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Events
              </span>
            </Link>
            <Link
              to="/opportunities"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                isActive('/opportunities') ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Opportunities
              </span>
            </Link>
            <Link
              to="/buyers"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                isActive('/buyers') ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Buyers
              </span>
            </Link>
            <Link
              to="/retail"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                isActive('/retail') ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                Retail
              </span>
            </Link>
            <Link
              to="/distribution"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                isActive('/distribution') ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Distribution
              </span>
            </Link>

            {user && (
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                  location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard')
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-secondary-600 hover:bg-secondary-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </span>
              </Link>
            )}

            <hr className="my-2 border-secondary-100" />

            {user ? (
              <>
                <div className="px-4 py-2 text-sm text-secondary-500">
                  Signed in as <span className="font-medium text-secondary-900">{user.email}</span>
                </div>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-secondary-600 hover:bg-secondary-50"
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 rounded-lg text-sm font-medium text-secondary-600 hover:bg-secondary-50"
                >
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign in
                  </span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white text-center"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-secondary-900 text-secondary-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">NCDEP</span>
            </div>
            <p className="text-sm text-secondary-400 max-w-md">
              The National Cooperative Discovery & Exchange Platform connects cooperatives with consumers,
              enabling discovery and economic growth across the nation.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Discover</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/cooperatives" className="text-sm hover:text-white transition-colors">
                  Cooperatives
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-sm hover:text-white transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-sm hover:text-white transition-colors">
                  Events
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Account</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="text-sm hover:text-white transition-colors">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm hover:text-white transition-colors">
                  Register
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-secondary-800 text-sm text-secondary-400 text-center">
          <p>&copy; {new Date().getFullYear()} NCDEP. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
