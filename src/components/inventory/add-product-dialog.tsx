"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Upload, X, ChefHat } from 'lucide-react';
import { AvailabilityManager } from './availability-manager';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  userId: string;
  onSuccess: () => void;
}

const DEFAULT_AVAILABILITY = {
  monday: { enabled: true, allDay: true, timeRanges: [] },
  tuesday: { enabled: true, allDay: true, timeRanges: [] },
  wednesday: { enabled: true, allDay: true, timeRanges: [] },
  thursday: { enabled: true, allDay: true, timeRanges: [] },
  friday: { enabled: true, allDay: true, timeRanges: [] },
};

export const AddProductDialog = ({ open, onOpenChange, categoryId, userId, onSuccess }: AddProductDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [applyTaxes, setApplyTaxes] = useState(true);
  const [requiresPreparation, setRequiresPreparation] = useState(false);
  const [preparationType, setPreparationType] = useState<'sandwich' | 'pizza'>('sandwich');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let imageUrl = null;

    if (image) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, image);

      if (uploadError) {
        showError('Erreur lors de l\'upload de l\'image');
        console.error(uploadError);
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      imageUrl = publicUrl;
    }

    const { error } = await supabase
      .from('products')
      .insert({
        category_id: categoryId,
        name: name.trim(),
        description: description.trim() || null,
        price: parseFloat(price),
        image_url: imageUrl,
        apply_taxes: applyTaxes,
        user_id: userId,
        position: 0,
        availability: availability,
        requires_preparation: requiresPreparation,
        preparation_type: requiresPreparation ? preparationType : null,
      });

    setUploading(false);

    if (error) {
      showError('Erreur lors de la création du produit');
      console.error(error);
    } else {
      showSuccess('Produit créé avec succès');
      setName('');
      setDescription('');
      setPrice('');
      setApplyTaxes(true);
      setRequiresPreparation(false);
      setPreparationType('sandwich');
      setImage(null);
      setImagePreview(null);
      setAvailability(DEFAULT_AVAILABILITY);
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-slate-900/95 border-blue-500/30 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            Nouveau produit
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-900/50">
              <TabsTrigger value="info" className="data-[state=active]:bg-blue-500/20">
                Informations
              </TabsTrigger>
              <TabsTrigger value="availability" className="data-[state=active]:bg-blue-500/20">
                Disponibilité
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="product-image" className="text-gray-300">Image du produit</Label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="absolute -top-2 -right-2 bg-red-500/80 border-red-400 hover:bg-red-600"
                        onClick={() => {
                          setImage(null);
                          setImagePreview(null);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="w-32 h-32 border-2 border-dashed border-blue-500/50 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
                      <Upload className="w-8 h-8 text-blue-400 mb-2" />
                      <span className="text-xs text-gray-400">Ajouter image</span>
                      <input
                        id="product-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-name" className="text-gray-300">Nom du produit *</Label>
                <Input
                  id="product-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Café Latte"
                  className="bg-slate-900/50 border-blue-500/50 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-description" className="text-gray-300">Description</Label>
                <Textarea
                  id="product-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description du produit..."
                  className="bg-slate-900/50 border-blue-500/50 text-white"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-price" className="text-gray-300">Prix (CAD) *</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="bg-slate-900/50 border-blue-500/50 text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-blue-500/30">
                <div className="space-y-1">
                  <Label htmlFor="apply-taxes" className="text-gray-300">Appliquer les taxes (TPS/TVQ)</Label>
                  <p className="text-xs text-gray-500">14.975% calculé individuellement</p>
                </div>
                <Switch
                  id="apply-taxes"
                  checked={applyTaxes}
                  onCheckedChange={setApplyTaxes}
                />
              </div>

              <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-orange-500/30">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="requires-preparation" className="text-gray-300 flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-orange-400" />
                      Produit doit être préparé
                    </Label>
                    <p className="text-xs text-gray-500">Active le système de file d'attente avec numéro</p>
                  </div>
                  <Switch
                    id="requires-preparation"
                    checked={requiresPreparation}
                    onCheckedChange={setRequiresPreparation}
                  />
                </div>

                {requiresPreparation && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="preparation-type" className="text-gray-300">Type de préparation</Label>
                    <Select value={preparationType} onValueChange={(value: 'sandwich' | 'pizza') => setPreparationType(value)}>
                      <SelectTrigger className="bg-slate-900/50 border-orange-500/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-orange-500/50">
                        <SelectItem value="sandwich" className="text-white">
                          Sandwich (4min 30s, max 4 simultanés)
                        </SelectItem>
                        <SelectItem value="pizza" className="text-white">
                          Pizza (13min, max 4 simultanés)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="availability" className="mt-4">
              <AvailabilityManager
                availability={availability}
                onChange={setAvailability}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t border-blue-500/30">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-slate-900/50 border-gray-500/50 text-gray-300"
              disabled={uploading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-500 text-white"
              disabled={uploading}
            >
              {uploading ? 'Création...' : 'Créer le produit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};