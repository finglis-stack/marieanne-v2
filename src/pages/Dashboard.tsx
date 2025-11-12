"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coffee, TrendingUp, Users, DollarSign, ShoppingCart, LogOut, Sparkles, Zap, CreditCard, Gift, Receipt, ChefHat, FileText, Activity, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { ParticleBackground } from '@/components/particle-background';
import { AuditFooter } from '@/components/audit/audit-footer';
import { createAuditLog } from '@/lib/audit';

interface DailyStats {
  totalSales: number;
  totalOrders: number;
  uniqueCustomers: number;
  totalProducts: number;
  previousDaySales: number;
  previousDayOrders: number;
  previousDayCustomers: number;
  previousDayProducts: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DailyStats>({
    totalSales: 0,
    totalOrders: 0,
    uniqueCustomers: 0,
    totalProducts: 0,
    previousDaySales: 0,
    previousDayOrders: 0,
    previousDayCustomers: 0,
    previousDayProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
      } else {
        setUser(user);
        await createAuditLog({
          action: 'VIEW_DASHBOARD',
          resourceType: 'USER',
          resourceId: user.id,
        });
        loadDailyStats();
      }
    };
    getUser();
  }, [navigate]);

  const loadDailyStats = async () => {
    setLoading(true);

    try {
      const now = new Date();
      const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const todayStart = new Date(estTime.getFullYear(), estTime.getMonth(), estTime.getDate(), 0, 0, 0);
      const todayEnd = new Date(estTime.getFullYear(), estTime.getMonth(), estTime.getDate(), 23, 59, 59);

      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayEnd = new Date(todayEnd);
      yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

      const { data: todayOrders, error: todayError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());

      if (todayError) {
        showError('Erreur lors du chargement des statistiques');
        console.error(todayError);
        setLoading(false);
        return;
      }

      const { data: yesterdayOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', yesterdayStart.toISOString())
        .lte('created_at', yesterdayEnd.toISOString());

      const totalSales = todayOrders?.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0) || 0;
      const totalOrders = todayOrders?.length || 0;
      const uniqueCustomers = new Set(todayOrders?.map(o => o.customer_profile_id).filter(Boolean)).size;
      const totalProducts = todayOrders?.reduce((sum, order) => {
        return sum + (order.items?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0);
      }, 0) || 0;

      const previousDaySales = yesterdayOrders?.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0) || 0;
      const previousDayOrders = yesterdayOrders?.length || 0;
      const previousDayCustomers = new Set(yesterdayOrders?.map(o => o.customer_profile_id).filter(Boolean)).size;
      const previousDayProducts = yesterdayOrders?.reduce((sum, order) => {
        return sum + (order.items?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0);
      }, 0) || 0;

      setStats({
        totalSales,
        totalOrders,
        uniqueCustomers,
        totalProducts,
        previousDaySales,
        previousDayOrders,
        previousDayCustomers,
        previousDayProducts,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      showError('Erreur lors du chargement des statistiques');
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await createAuditLog({
      action: 'LOGOUT',
      resourceType: 'USER',
      resourceId: user?.id,
    });
    await supabase.auth.signOut();
    showSuccess('Déconnexion réussie !');
    navigate('/');
  };

  const calculateChange = (current: number, previous: number): string => {
    if (previous === 0) {
      return current > 0 ? '+100%' : '0%';
    }
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const isPositiveChange = (current: number, previous: number): boolean => {
    return current >= previous;
  };

  const statsData = [
    { 
      icon: DollarSign, 
      label: 'Ventes du jour', 
      value: `${stats.totalSales.toFixed(2)} $`, 
      change: calculateChange(stats.totalSales, stats.previousDaySales),
      isPositive: isPositiveChange(stats.totalSales, stats.previousDaySales),
      color: 'from-green-500 to-emerald-500' 
    },
    { 
      icon: ShoppingCart, 
      label: 'Commandes', 
      value: stats.totalOrders.toString(), 
      change: calculateChange(stats.totalOrders, stats.previousDayOrders),
      isPositive: isPositiveChange(stats.totalOrders, stats.previousDayOrders),
      color: 'from-blue-500 to-cyan-500' 
    },
    { 
      icon: Users, 
      label: 'Clients', 
      value: stats.uniqueCustomers.toString(), 
      change: calculateChange(stats.uniqueCustomers, stats.previousDayCustomers),
      isPositive: isPositiveChange(stats.uniqueCustomers, stats.previousDayCustomers),
      color: 'from-purple-500 to-pink-500' 
    },
    { 
      icon: Coffee, 
      label: 'Produits vendus', 
      value: stats.totalProducts.toString(), 
      change: calculateChange(stats.totalProducts, stats.previousDayProducts),
      isPositive: isPositiveChange(stats.totalProducts, stats.previousDayProducts),
      color: 'from-orange-500 to-red-500' 
    },
  ];

  const quickActions = [
    { label: 'Point de Vente', onClick: () => navigate('/pos'), icon: CreditCard },
    { label: 'Inventaire', onClick: () => navigate('/inventory'), icon: ShoppingCart },
    { label: 'Cartes Récompenses', onClick: () => navigate('/reward-cards'), icon: Gift },
    { label: 'Transactions', onClick: () => navigate('/transactions'), icon: Receipt },
    { label: 'File d\'attente', onClick: () => navigate('/preparation-queue'), icon: ChefHat },
    { label: 'Rapports', onClick: () => navigate('/reports'), icon: FileText },
    { label: 'Grand Livre', onClick: () => navigate('/audit-logs'), icon: Activity },
    { label: 'Appareils', onClick: () => navigate('/device-management'), icon: Shield },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/foodiesfeed.com_refreshing-berry-medley-with-mint-splash.png)',
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-blue-950/85 to-slate-950/90" />
      <div className="absolute inset-0 bg-blue-900/30" />
      
      <ParticleBackground />
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 rounded-2xl p-6 shadow-2xl shadow-blue-500/20">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-50 animate-pulse" />
                <Coffee className="w-12 h-12 text-blue-400 relative" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  CAFÉ MARIE ANNE
                </h1>
                <p className="text-gray-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Bienvenue, {user?.email}
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-slate-900/50 border-red-500/50 hover:bg-red-500/20 hover:border-red-400 text-gray-300 hover:text-white transition-all duration-300 hover:scale-105"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
              <p className="text-gray-400 mt-4">Chargement des statistiques...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsData.map((stat, index) => (
                  <Card
                    key={index}
                    className="backdrop-blur-xl bg-slate-900/40 border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden group hover:scale-105 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-cyan-600/10 pointer-events-none" />
                    <div className="relative p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-semibold ${stat.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          <TrendingUp className={`w-4 h-4 ${!stat.isPositive && 'rotate-180'}`} />
                          {stat.change}
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">{stat.label}</p>
                        <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="backdrop-blur-xl bg-slate-900/40 border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden animate-in fade-in slide-in-from-left-4 duration-1000">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-cyan-600/10 pointer-events-none" />
                  <div className="relative p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Zap className="w-6 h-6 text-blue-400" />
                      <h2 className="text-2xl font-bold text-white">Actions rapides</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {quickActions.map((action, index) => (
                        <Button
                          key={index}
                          onClick={action.onClick}
                          className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-500 text-white font-semibold py-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50 flex items-center justify-center gap-2"
                        >
                          <action.icon className="w-5 h-5" />
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card className="backdrop-blur-xl bg-slate-900/40 border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-1000">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-cyan-600/10 pointer-events-none" />
                  <div className="relative p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Coffee className="w-6 h-6 text-blue-400" />
                      <h2 className="text-2xl font-bold text-white">Statistiques du jour</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-blue-500/20">
                        <span className="text-white font-medium">Période</span>
                        <span className="text-gray-400 text-sm">00:00 - 23:59 (EST)</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-blue-500/20">
                        <span className="text-white font-medium">Ventes totales</span>
                        <span className="text-green-400 font-bold">{stats.totalSales.toFixed(2)} $</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-blue-500/20">
                        <span className="text-white font-medium">Commandes</span>
                        <span className="text-blue-400 font-bold">{stats.totalOrders}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-blue-500/20">
                        <span className="text-white font-medium">Clients uniques</span>
                        <span className="text-purple-400 font-bold">{stats.uniqueCustomers}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-300 text-xs flex items-center gap-2 z-10">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Système actif • Temps réel • Heure EST
      </div>

      <AuditFooter />
    </div>
  );
};

export default Dashboard;