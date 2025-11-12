"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ParticleBackground } from '@/components/particle-background';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Search, Gift, User, CreditCard, Sparkles, ChevronLeft, ChevronRight, Lock, Eye, EyeOff } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { Card } from '@/components/ui/card';
import { CreateCardDialog } from '@/components/reward-cards/create-card-dialog';
import { CustomerCard } from '@/components/reward-cards/customer-card';
import { decryptBatch } from '@/lib/crypto';

interface CustomerProfile {
  id: string;
  customer_number: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

interface RewardCard {
  id: string;
  card_code: string;
  customer_profile_id: string;
  is_active: boolean;
  created_at: string;
}

interface CustomerWithCards extends CustomerProfile {
  cards: RewardCard[];
}

const ITEMS_PER_PAGE = 6;

const RewardCards = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [customers, setCustomers] = useState<CustomerWithCards[]>([]);
  const [decryptedCustomers, setDecryptedCustomers] = useState<CustomerWithCards[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
      } else {
        setUser(user);
        loadData();
      }
    };
    getUser();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);

    const { data: profilesData, error: profilesError } = await supabase
      .from('customer_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      showError('Erreur lors du chargement des fiches clients');
      console.error(profilesError);
      setLoading(false);
      return;
    }

    const { data: cardsData, error: cardsError } = await supabase
      .from('reward_cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (cardsError) {
      showError('Erreur lors du chargement des cartes');
      console.error(cardsError);
      setLoading(false);
      return;
    }

    const customersWithCards: CustomerWithCards[] = (profilesData || []).map(profile => ({
      ...profile,
      cards: (cardsData || []).filter(card => card.customer_profile_id === profile.id),
    }));

    setCustomers(customersWithCards);
    setLoading(false);
  };

  const handleUnlockSensitiveData = () => {
    setPasswordDialogOpen(true);
  };

  const handleLockSensitiveData = () => {
    setShowSensitiveData(false);
    setDecryptedCustomers([]);
  };

  const handleVerifyPassword = async () => {
    setVerifying(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: password,
    });

    if (error) {
      showError('Mot de passe incorrect');
      setVerifying(false);
      return;
    }

    try {
      const decrypted = await Promise.all(
        customers.map(async (customer) => {
          try {
            const toDecrypt: { [key: string]: string } = {};
            
            if (customer.customer_number) toDecrypt.customer_number = customer.customer_number;
            if (customer.first_name) toDecrypt.first_name = customer.first_name;
            if (customer.last_name) toDecrypt.last_name = customer.last_name;
            if (customer.email) toDecrypt.email = customer.email;
            if (customer.phone) toDecrypt.phone = customer.phone;
            if (customer.notes) toDecrypt.notes = customer.notes;

            const decryptedData = await decryptBatch(toDecrypt);

            return {
              ...customer,
              customer_number: decryptedData.customer_number || customer.customer_number,
              first_name: decryptedData.first_name || customer.first_name,
              last_name: decryptedData.last_name || customer.last_name,
              email: decryptedData.email || customer.email,
              phone: decryptedData.phone || customer.phone,
              notes: decryptedData.notes || customer.notes,
            };
          } catch (error) {
            console.error('Decryption error for customer:', customer.id, error);
            return customer;
          }
        })
      );

      setDecryptedCustomers(decrypted);
      setShowSensitiveData(true);
      showSuccess('Données déchiffrées avec succès');
    } catch (error) {
      console.error('Decryption error:', error);
      showError('Erreur lors du déchiffrement');
    }

    setPasswordDialogOpen(false);
    setPassword('');
    setVerifying(false);
  };

  const displayCustomers = showSensitiveData ? decryptedCustomers : customers;

  const filteredCustomers = displayCustomers.filter(customer => {
    const searchLower = searchQuery.toLowerCase();
    
    if (showSensitiveData) {
      return (
        customer.customer_number?.toString().toLowerCase().includes(searchLower) ||
        customer.first_name?.toLowerCase().includes(searchLower) ||
        customer.cards.some(card => card.card_code.toLowerCase().includes(searchLower))
      );
    } else {
      return customer.cards.some(card => card.card_code.toLowerCase().includes(searchLower));
    }
  });

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  const totalCards = customers.reduce((sum, customer) => sum + customer.cards.length, 0);
  const activeCards = customers.reduce((sum, customer) => 
    sum + customer.cards.filter(card => card.is_active).length, 0
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <ParticleBackground />
        <div className="relative z-10 text-white text-xl">Chargement...</div>
      </div>
    );
  }

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

      <div className="relative z-10 p-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 rounded-2xl p-6 shadow-2xl shadow-blue-500/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  className="bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-400 text-gray-300 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                    Cartes Récompenses
                  </h1>
                  <p className="text-gray-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Gestion des fiches clients et cartes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!showSensitiveData ? (
                  <Button
                    onClick={handleUnlockSensitiveData}
                    variant="outline"
                    className="bg-slate-900/50 border-orange-500/50 hover:bg-orange-500/20 text-orange-400"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Déverrouiller
                  </Button>
                ) : (
                  <Button
                    onClick={handleLockSensitiveData}
                    variant="outline"
                    className="bg-slate-900/50 border-green-500/50 hover:bg-green-500/20 text-green-400"
                  >
                    <EyeOff className="w-4 h-4 mr-2" />
                    Verrouiller
                  </Button>
                )}
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-semibold transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle carte
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Fiches clients</p>
                    <p className="text-2xl font-bold text-white">{customers.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Cartes totales</p>
                    <p className="text-2xl font-bold text-white">{totalCards}</p>
                  </div>
                </div>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Cartes actives</p>
                    <p className="text-2xl font-bold text-white">{activeCards}</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={showSensitiveData ? "Rechercher par numéro, nom ou code de carte..." : "Rechercher par code de carte..."}
                className="pl-10 bg-slate-900/50 border-blue-500/50 text-white placeholder:text-gray-500 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onRefresh={loadData}
                onClick={() => navigate(`/reward-cards/${customer.id}`)}
                showSensitiveData={showSensitiveData}
              />
            ))}
          </div>

          {filteredCustomers.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-center gap-4 backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 rounded-2xl p-4">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                className="bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 text-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Précédent
              </Button>
              
              <span className="text-white font-semibold">
                Page {currentPage} sur {totalPages}
              </span>
              
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                className="bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 text-white disabled:opacity-50"
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {filteredCustomers.length === 0 && (
            <div className="backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 rounded-2xl p-12 text-center shadow-2xl shadow-blue-500/20">
              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-4">
                {searchQuery ? 'Aucun résultat trouvé' : 'Aucune carte récompense pour le moment'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer votre première carte
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <CreateCardDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={loadData}
      />

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="backdrop-blur-xl bg-slate-900/95 border-orange-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
              <Lock className="w-6 h-6 text-orange-400" />
              Authentification requise
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-gray-300">
              Pour des raisons de sécurité, veuillez entrer votre mot de passe pour déchiffrer les informations sensibles.
            </p>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-900/50 border-orange-500/50 text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleVerifyPassword();
                  }
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setPasswordDialogOpen(false)}
                variant="outline"
                className="bg-slate-900/50 border-gray-500/50 text-gray-300"
                disabled={verifying}
              >
                Annuler
              </Button>
              <Button
                onClick={handleVerifyPassword}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white"
                disabled={verifying || !password}
              >
                {verifying ? 'Vérification...' : 'Déverrouiller'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RewardCards;