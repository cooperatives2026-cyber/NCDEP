import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/auth';
import { Layout, LoadingPage, LoadingSpinner } from './components/shared';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/public/HomePage').then(m => ({ default: m.HomePage })));
const CooperativesPage = lazy(() => import('./pages/public/CooperativesPage').then(m => ({ default: m.CooperativesPage })));
const CooperativeDetailPage = lazy(() => import('./pages/public/CooperativeDetailPage').then(m => ({ default: m.CooperativeDetailPage })));
const ProductsPage = lazy(() => import('./pages/public/ProductsPage').then(m => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('./pages/public/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const EventsPage = lazy(() => import('./pages/public/EventsPage').then(m => ({ default: m.EventsPage })));
const EventDetailPage = lazy(() => import('./pages/public/EventDetailPage').then(m => ({ default: m.EventDetailPage })));
const BuyersPage = lazy(() => import('./pages/public/BuyersPage').then(m => ({ default: m.BuyersPage })));
const OpportunitiesPage = lazy(() => import('./pages/public/OpportunitiesPage').then(m => ({ default: m.OpportunitiesPage })));
const OpportunityDetailPage = lazy(() => import('./pages/public/OpportunityDetailPage').then(m => ({ default: m.OpportunityDetailPage })));
const RetailOutletsPage = lazy(() => import('./pages/public/RetailOutletsPage').then(m => ({ default: m.RetailOutletsPage })));
const DistributionPartnersPage = lazy(() => import('./pages/public/DistributionPartnersPage').then(m => ({ default: m.DistributionPartnersPage })));

const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));

const CooperativeDashboard = lazy(() => import('./pages/dashboard/CooperativeDashboard').then(m => ({ default: m.CooperativeDashboard })));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

const CooperativeFormPage = lazy(() => import('./pages/cooperative/CooperativeFormPage').then(m => ({ default: m.CooperativeFormPage })));

const ProductFormPage = lazy(() => import('./pages/product/ProductFormPage').then(m => ({ default: m.ProductFormPage })));
const ProductListPage = lazy(() => import('./pages/product/ProductListPage').then(m => ({ default: m.ProductListPage })));
const ProductPerformancePage = lazy(() => import('./pages/product/ProductPerformancePage').then(m => ({ default: m.ProductPerformancePage })));

const AdminCooperativesPage = lazy(() => import('./pages/admin/AdminCooperativesPage').then(m => ({ default: m.AdminCooperativesPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage').then(m => ({ default: m.AdminProductsPage })));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage').then(m => ({ default: m.AdminReviewsPage })));
const AdminEventsPage = lazy(() => import('./pages/admin/AdminEventsPage').then(m => ({ default: m.AdminEventsPage })));
const AdminEventDetailPage = lazy(() => import('./pages/admin/AdminEventDetailPage').then(m => ({ default: m.AdminEventDetailPage })));
const EventFormPage = lazy(() => import('./pages/admin/EventFormPage').then(m => ({ default: m.EventFormPage })));
const AdminBuyersPage = lazy(() => import('./pages/admin/AdminBuyersPage').then(m => ({ default: m.AdminBuyersPage })));
const AdminOpportunitiesPage = lazy(() => import('./pages/admin/AdminOpportunitiesPage').then(m => ({ default: m.AdminOpportunitiesPage })));
const AdminOpportunityDetailPage = lazy(() => import('./pages/admin/AdminOpportunityDetailPage').then(m => ({ default: m.AdminOpportunityDetailPage })));
const AdminRetailOutletsPage = lazy(() => import('./pages/admin/AdminRetailOutletsPage').then(m => ({ default: m.AdminRetailOutletsPage })));
const AdminDistributionPartnersPage = lazy(() => import('./pages/admin/AdminDistributionPartnersPage').then(m => ({ default: m.AdminDistributionPartnersPage })));
const AdminAggregationCentersPage = lazy(() => import('./pages/admin/AdminAggregationCentersPage').then(m => ({ default: m.AdminAggregationCentersPage })));
const AdminDistributionRequestsPage = lazy(() => import('./pages/admin/AdminDistributionRequestsPage').then(m => ({ default: m.AdminDistributionRequestsPage })));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <LoadingSpinner size="lg" />
    </div>
  );
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />
        <Route
          path="/cooperatives"
          element={
            <Layout>
              <CooperativesPage />
            </Layout>
          }
        />
        <Route
          path="/cooperatives/:id"
          element={
            <Layout>
              <CooperativeDetailPage />
            </Layout>
          }
        />
        <Route
          path="/products"
          element={
            <Layout>
              <ProductsPage />
            </Layout>
          }
        />
        <Route
          path="/products/:id"
          element={
            <Layout>
              <ProductDetailPage />
            </Layout>
          }
        />
        <Route
          path="/events"
          element={
            <Layout>
              <EventsPage />
            </Layout>
          }
        />
        <Route
          path="/events/:id"
          element={
            <Layout>
              <EventDetailPage />
            </Layout>
          }
        />

        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Cooperative user dashboard routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <CooperativeDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/cooperative"
          element={<Navigate to="/dashboard/cooperative/new" replace />}
        />
        <Route
          path="/dashboard/cooperative/new"
          element={
            <ProtectedRoute>
              <Layout>
                <CooperativeFormPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/cooperative/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <CooperativeFormPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/products"
          element={
            <ProtectedRoute>
              <Layout>
                <ProductListPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/products/new"
          element={
            <ProtectedRoute>
              <Layout>
                <ProductFormPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/products/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <ProductFormPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/products/:id/performance"
          element={
            <ProtectedRoute>
              <Layout>
                <ProductPerformancePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin dashboard routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cooperatives"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminCooperativesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cooperatives/:id"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminCooperativesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminProductsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/:id"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminProductsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminUsersPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminReviewsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminEventsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/new"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <EventFormPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/:id"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminEventDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/:id/edit"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <EventFormPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/buyers"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminBuyersPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/opportunities"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminOpportunitiesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/opportunities/:id"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminOpportunityDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/retail-outlets"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminRetailOutletsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/distribution-partners"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminDistributionPartnersPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/aggregation-centers"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminAggregationCentersPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/distribution-requests"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminDistributionRequestsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Public buyer and opportunity routes */}
        <Route
          path="/buyers"
          element={
            <Layout>
              <BuyersPage />
            </Layout>
          }
        />
        <Route
          path="/buyers/:id"
          element={
            <Layout>
              <div className="max-w-3xl mx-auto px-4 py-8"><h1 className="text-2xl font-bold">Buyer Profile</h1><p className="text-secondary-600 mt-2">Coming soon</p></div>
            </Layout>
          }
        />
        <Route
          path="/opportunities"
          element={
            <Layout>
              <OpportunitiesPage />
            </Layout>
          }
        />
        <Route
          path="/opportunities/:id"
          element={
            <Layout>
              <OpportunityDetailPage />
            </Layout>
          }
        />
        <Route
          path="/retail"
          element={
            <Layout>
              <RetailOutletsPage />
            </Layout>
          }
        />
        <Route
          path="/distribution"
          element={
            <Layout>
              <DistributionPartnersPage />
            </Layout>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <Layout>
              <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold text-secondary-900 mb-4">404</h1>
                <p className="text-secondary-600 mb-8">Page not found</p>
                <a
                  href="/"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Go Home
                </a>
              </div>
            </Layout>
          }
        />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
