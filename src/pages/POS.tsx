"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ParticleBackground } from '@/components/particle-background';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, ShoppingCart, Sparkles, Coffee } from 'lucide-react';
import { showError } from '@/utils/toast';
import { ProductGrid } from '@/components/pos/product-grid';
import { CheckoutPanel } from '@/components/pos/checkout-panel';
import { PreparationDisplay } from '@/components/pos/preparation-display';

interface Category {
  id: string;
  name: string;
  position: number;
}

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  position: number;
  apply_taxes: boolean;
  availability?: any;
  requires_preparation?: boolean;
  preparation_type?: 'sandwich' | 'pizza' | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const POS = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
      } else {
        setUser(user);
        loadData(user.id);
      }
    };
    getUser();
  }, [navigate]);

  const loadData = async (userId: string) => {
    setLoading(true);
    
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('position');

    if (categoriesError) {
      showError('Erreur lors du chargement des catégories');
      console.error(categoriesError);
    } else {
      setCategories(categoriesData || []);
    }

    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('position');

    if (productsError) {
      showError('Erreur lors du chargement des produits');
      console.error(productsError);
    } else {
      setProducts(productsData || []);
    }

    setLoading(false);
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <div className="relative z-10 h-screen flex flex-col">
        <div className="backdrop-blur-xl bg-slate-900/40 border-b border-blue-500/30 p-4 shadow-2xl shadow-blue-500/20">
          <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-400 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="flex items-center gap-3">
                <Coffee className="w-8 h-8 text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                    Point de Vente
                  </h1>
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Système de caisse
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="pl-10 bg-slate-900/50 border-blue-500/50 text-white placeholder:text-gray-500 focus:border-blue-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-white">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              <span className="font-semibold">{cart.reduce((sum, item) => sum + item.quantity, 0)} articles</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto p-6">
            <ProductGrid
              categories={categories}
              products={filteredProducts}
              onAddToCart={addToCart}
            />
          </div>

          <div className="w-[450px] flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <CheckoutPanel
                cart={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveFromCart={removeFromCart}
                onClearCart={clearCart}
              />
            </div>
            
            <div className="border-t border-blue-500/30 p-4 backdrop-blur-xl bg-slate-900/60">
              <PreparationDisplay />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;