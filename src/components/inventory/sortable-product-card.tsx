"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, DollarSign, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { EditProductDialog } from './edit-product-dialog';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface SortableProductCardProps {
  product: Product;
  onRefresh: () => void;
}

export const SortableProductCard = ({ product, onRefresh }: SortableProductCardProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const TAX_RATE = 0.14975;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const calculatePriceWithTax = (price: number) => {
    if (!product.apply_taxes) return price;
    const taxAmount = price * TAX_RATE;
    return price + taxAmount;
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    if (product.image_url) {
      const imagePath = product.image_url.split('/').pop();
      if (imagePath) {
        await supabase.storage
          .from('product-images')
          .remove([imagePath]);
      }
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);

    if (error) {
      showError('Erreur lors de la suppression du produit');
      console.error(error);
    } else {
      showSuccess('Produit supprimé avec succès');
      onRefresh();
    }
  };

  const priceWithTax = calculatePriceWithTax(product.price);

  return (
    <>
      <Card 
        ref={setNodeRef}
        style={style}
        className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 overflow-hidden group hover:border-blue-400/50 transition-all hover:scale-105"
      >
        <div className="relative">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 flex items-center justify-center">
              <DollarSign className="w-16 h-16 text-blue-400/50" />
            </div>
          )}
          <div 
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 cursor-grab active:cursor-grabbing bg-slate-900/80 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="w-4 h-4 text-blue-400" />
          </div>
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              onClick={() => setIsEditOpen(true)}
              size="sm"
              className="bg-slate-900/80 border-blue-500/50 hover:bg-blue-500/20 text-white"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button
              onClick={handleDelete}
              size="sm"
              className="bg-slate-900/80 border-red-500/50 hover:bg-red-500/20 text-white"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <div className="p-4 space-y-2">
          <h3 className="text-white font-semibold truncate">{product.name}</h3>
          {product.description && (
            <p className="text-gray-400 text-sm line-clamp-2">{product.description}</p>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 font-bold">{product.price.toFixed(2)} $</p>
              {product.apply_taxes && (
                <p className="text-gray-500 text-xs">
                  {priceWithTax.toFixed(2)} $ (taxes incl.)
                </p>
              )}
            </div>
            {product.apply_taxes && (
              <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded">
                +TPS/TVQ
              </span>
            )}
          </div>
        </div>
      </Card>

      <EditProductDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        product={product}
        onSuccess={onRefresh}
      />
    </>
  );
};