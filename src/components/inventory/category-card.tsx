"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Plus, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { SortableProductCard } from './sortable-product-card';
import { AddProductDialog } from './add-product-dialog';
import { EditCategoryDialog } from './edit-category-dialog';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

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

interface CategoryCardProps {
  category: Category;
  products: Product[];
  onDeleteCategory: (categoryId: string) => void;
  onUpdateCategory: (categoryId: string, name: string) => void;
  onRefreshProducts: () => void;
  userId: string;
}

export const CategoryCard = ({ 
  category, 
  products, 
  onDeleteCategory, 
  onUpdateCategory,
  onRefreshProducts,
  userId 
}: CategoryCardProps) => {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `category-${category.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className="backdrop-blur-xl bg-slate-900/40 border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-cyan-600/10 pointer-events-none" />
        
        <div className="relative p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-blue-400 transition-colors"
              >
                <GripVertical className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">{category.name}</h2>
              <span className="text-sm text-gray-400">({products.length} produits)</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsEditCategoryOpen(true)}
                variant="outline"
                size="sm"
                className="bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-400 text-gray-300 hover:text-white"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => onDeleteCategory(category.id)}
                variant="outline"
                size="sm"
                className="bg-slate-900/50 border-red-500/50 hover:bg-red-500/20 hover:border-red-400 text-gray-300 hover:text-white"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setIsAddProductOpen(true)}
                size="sm"
                className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-500 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter produit
              </Button>
            </div>
          </div>

          <div ref={setDroppableRef}>
            <SortableContext
              items={products.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <SortableProductCard
                    key={product.id}
                    product={product}
                    onRefresh={onRefreshProducts}
                  />
                ))}
              </div>
            </SortableContext>
          </div>

          {products.length === 0 && (
            <div className="text-center py-8 text-gray-400 min-h-[100px] flex items-center justify-center border-2 border-dashed border-blue-500/20 rounded-lg">
              Aucun produit dans cette catégorie
            </div>
          )}
        </div>
      </Card>

      <AddProductDialog
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
        categoryId={category.id}
        userId={userId}
        onSuccess={onRefreshProducts}
      />

      <EditCategoryDialog
        open={isEditCategoryOpen}
        onOpenChange={setIsEditCategoryOpen}
        category={category}
        onUpdate={onUpdateCategory}
      />
    </>
  );
};