import { Link } from 'react-router-dom';
import { Building2, Package, Search, Users, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/shared';
import { useEffect, useState } from 'react';

interface Stats {
  cooperatives: number;
  products: number;
}

export function HomePage() {
  const [stats, setStats] = useState<Stats>({ cooperatives: 0, products: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { count: coopCount } = await supabase
        .from('cooperatives')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .is('deleted_at', null);

      const { count: prodCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .is('deleted_at', null);

      setStats({
        cooperatives: coopCount || 0,
        products: prodCount || 0,
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI1Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Discover Cooperatives
              <br />
              <span className="text-primary-200">Near You</span>
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto mb-8">
              Connect with cooperatives across the nation. Browse products, find local services,
              and support community-driven businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cooperatives">
                <Button variant="secondary" size="lg" icon={<Building2 className="w-5 h-5" />}>
                  Browse Cooperatives
                </Button>
              </Link>
              <Link to="/products">
                <Button
                  variant="outline"
                  size="lg"
                  icon={<Package className="w-5 h-5" />}
                  className="!border-white/30 !text-white hover:!bg-white/10"
                >
                  Explore Products
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-secondary-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-7 h-7 text-primary-600" />
              </div>
              <p className="text-3xl font-bold text-secondary-900">{stats.cooperatives}</p>
              <p className="text-sm text-secondary-600">Cooperatives</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-accent-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Package className="w-7 h-7 text-accent-600" />
              </div>
              <p className="text-3xl font-bold text-secondary-900">{stats.products}</p>
              <p className="text-sm text-secondary-600">Products</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-4">
              Why Use NCDEP?
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              A centralized platform to discover, connect, and engage with cooperatives nationwide.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-secondary-50 rounded-xl p-6">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">Easy Discovery</h3>
              <p className="text-secondary-600">
                Search and filter cooperatives by county, category, or product. Find what you need quickly.
              </p>
            </div>

            <div className="bg-secondary-50 rounded-xl p-6">
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent-600" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">Community-Focused</h3>
              <p className="text-secondary-600">
                Support local cooperatives and contribute to community economic growth.
              </p>
            </div>

            <div className="bg-secondary-50 rounded-xl p-6">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-success-600" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">Economic Impact</h3>
              <p className="text-secondary-600">
                Every purchase supports cooperative members and strengthens local economies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-secondary-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to join the cooperative network?
          </h2>
          <p className="text-secondary-300 mb-8 max-w-xl mx-auto">
            Create your cooperative profile today and reach consumers across the nation.
          </p>
          <Link to="/register">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
