"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ParticleBackground } from '@/components/particle-background';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Sparkles } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CategoryCard } from '@/components/inventory/category-card';
import { AddCategoryDialog } from '@/components/inventory/add-category-dialog';
import { ProductCard } from '@/components/inventory/product-card';

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
}

const Inventory = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const product = products.find(p => p.id === active.id);
    if (product) {
      setActiveProduct(product);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Si on survole une catégorie
    if (typeof overId === 'string' && overId.startsWith('category-')) {
      const newCategoryId = overId.replace('category-', '');
      const activeProduct = products.find(p => p.id === activeId);
      
      if (activeProduct && activeProduct.category_id !== newCategoryId) {
        setProducts(products.map(p => 
          p.id === activeId ? { ...p, category_id: newCategoryId } : p
        ));
      }
    }
    
    // Si on survole un autre produit
    if (products.find(p => p.id === overId)) {
      const activeProduct = products.find(p => p.id === activeId);
      const overProduct = products.find(p => p.id === overId);
      
      if (activeProduct && overProduct && activeProduct.category_id === overProduct.category_id) {
        const oldIndex = products.findIndex(p => p.id === activeId);
        const newIndex = products.findIndex(p => p.id === overId);
        
        setProducts(arrayMove(products, oldIndex, newIndex));
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveProduct(null);

    if (!over) return;

    const activeId = active.id;
    const activeProduct = products.find(p => p.id === activeId);
    
    if (!activeProduct) {
      // C'est une catégorie qui a été déplacée
      const oldIndex = categories.findIndex((cat) => cat.id === activeId);
      const newIndex = categories.findIndex((cat) => cat.id === over.id);

      if (oldIndex !== newIndex) {
        const newCategories = arrayMove(categories, oldIndex, newIndex);
        setCategories(newCategories);

        const updates = newCategories.map((cat, index) => ({
          id: cat.id,
          position: index,
        }));

        for (const update of updates) {
          await supabase
            .from('categories')
            .update({ position: update.position })
            .eq('id', update.id);
        }

        showSuccess('Ordre des catégories mis à jour');
      }
      return;
    }

    // Mise à jour du produit dans la base de données
    const categoryProducts = products.filter(p => p.category_id === activeProduct.category_id);
    const updates = categoryProducts.map((p, index) => ({
      id: p.id,
      position: index,
      category_id: p.category_id,
    }));

    for (const update of updates) {
      await supabase
        .from('products')
        .update({ 
          position: update.position,
          category_id: update.category_id 
        })
        .eq('id', update.id);
    }

    showSuccess('Produit déplacé avec succès');
  };

  const handleAddCategory = async (name: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        position: categories.length,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      showError('Erreur lors de la création de la catégorie');
      console.error(error);
    } else {
      setCategories([...categories, data]);
      showSuccess('Catégorie créée avec succès');
      setIsAddCategoryOpen(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      showError('Erreur lors de la suppression de la catégorie');
      console.error(error);
    } else {
      setCategories(categories.filter(cat => cat.id !== categoryId));
      setProducts(products.filter(prod => prod.category_id !== categoryId));
      showSuccess('Catégorie supprimée avec succès');
    }
  };

  const handleUpdateCategory = async (categoryId: string, name: string) => {
    const { error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', categoryId);

    if (error) {
      showError('Erreur lors de la mise à jour de la catégorie');
      console.error(error);
    } else {
      setCategories(categories.map(cat => 
        cat.id === categoryId ? { ...cat, name } : cat
      ));
      showSuccess('Catégorie mise à jour');
    }
  };

  const refreshProducts = () => {
    if (user) {
      loadData(user.id);
    }
  };

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
          <div className="flex items-center justify-between backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 rounded-2xl p-6 shadow-2xl shadow-blue-500/20">
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
                  Gestion de l'inventaire
                </h1>
                <p className="text-gray-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Organisez vos produits et catégories
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsAddCategoryOpen(true)}
              className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-500 text-white font-semibold transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle catégorie
            </Button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories.map(cat => cat.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-6">
                {categories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    products={products.filter(p => p.category_id === category.id)}
                    onDeleteCategory={handleDeleteCategory}
                    onUpdateCategory={handleUpdateCategory}
                    onRefreshProducts={refreshProducts}
                    userId={user?.id}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeProduct ? (
                <div className="opacity-80">
                  <ProductCard product={activeProduct} onRefresh={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {categories.length === 0 && (
            <div className="backdrop-blur-xl bg-slate-900/40 border border-blue-500/30 rounded-2xl p-12 text-center shadow-2xl shadow-blue-500/20">
              <p className="text-gray-400 text-lg mb-4">Aucune catégorie pour le moment</p>
              <Button
                onClick={() => setIsAddCategoryOpen(true)}
                className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-500 text-white font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer votre première catégorie
              </Button>
            </div>
          )}
        </div>
      </div>

      <AddCategoryDialog
        open={isAddCategoryOpen}
        onOpenChange={setIsAddCategoryOpen}
        onAdd={handleAddCategory}
      />
    </div>
  );
};

export default Inventory;