// src/app/admin/decors/page.tsx
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, Loader2, Trash2, ImagePlus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Product } from '@/lib/types';
import { usePavoData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export default function DecorsAdmin() {
  const { decorProducts, loading, addOrUpdateDecorProduct, deleteDecorProduct } = usePavoData();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const openForm = (product?: Product) => {
    setEditingProduct(product || { image_urls: [] });
    setImageFiles([]);
    setUploadProgress(0);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setTimeout(() => {
        setEditingProduct(null);
        setImageFiles([]);
        setUploadProgress(0);
    }, 300);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0] || null;
    const newFiles = [...imageFiles];
    newFiles[index] = file;
    setImageFiles(newFiles);
  };

  const addImageField = () => setImageFiles(prev => [...prev, null]);
  
  const removeImage = (type: 'existing' | 'new', index: number) => {
    if (type === 'new') {
      setImageFiles(prev => prev.filter((_, i) => i !== index));
    } else if (editingProduct) {
      const currentProduct = { ...editingProduct };
      currentProduct.image_urls = currentProduct.image_urls?.filter((_, i) => i !== index);
      setEditingProduct(currentProduct);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setUploadProgress(0);

    const form = event.currentTarget;
    
    try {
      const productData: Partial<Product> = {
          ...editingProduct,
          name: form.name.value,
          category: form.category.value,
          price: Number(form.price.value),
          stock: Number(form.stock.value),
          aiHint: form.aiHint.value,
      };

      const finalImageFiles = imageFiles.filter((f): f is File => f !== null);
      await addOrUpdateDecorProduct(productData, finalImageFiles, setUploadProgress);

      toast({ title: 'Success!', description: 'Product saved successfully.' });
      closeForm();

    } catch (error: any) {
        console.error("Error saving product:", error);
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'An unknown error occurred' });
    } finally {
        setIsSubmitting(false);
        setUploadProgress(0);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDecorProduct(id);
      toast({
        title: 'Product Deleted',
        description: 'The product has been successfully deleted.',
      });
    } catch (error) {
       // Error toast is handled by context
    }
  };
  
  const getFileName = (url: string | null | undefined) => {
    if (!url) return null;
    try {
      const decodedUrl = decodeURIComponent(url);
      return decodedUrl.substring(decodedUrl.lastIndexOf('/') + 1).split('?')[0];
    } catch (e) {
      return "Invalid URL";
    }
  };

  return (
    <div>
        <div className="flex items-center">
            <h1 className="font-headline text-3xl font-bold">Decor Products</h1>
            <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => openForm()}>
                    <PlusCircle className="h-4 w-4 mr-2"/>
                    Add Product
                </Button>
            </div>
        </div>
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>Manage your decor products. Data is synced with Supabase.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {decorProducts.map(product => (
                            <TableRow key={product.id}>
                                <TableCell className="hidden sm:table-cell">
                                    <img
                                        alt={product.name}
                                        className="aspect-square rounded-md object-cover"
                                        height="64"
                                        src={product.image_urls?.[0] && typeof product.image_urls[0] === 'string' && product.image_urls[0].trim() ? product.image_urls[0] : 'https://placehold.co/64x64/png'}
                                        width="64"
                                        data-ai-hint={product.aiHint}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{product.category}</Badge>
                                </TableCell>
                                <TableCell>{product.price.toLocaleString()} TZS</TableCell>
                                <TableCell>
                                    {product.stock === 0 ? (
                                        <Badge variant="destructive">Out of Stock</Badge>
                                    ) : product.stock < 5 ? (
                                        <Badge variant="secondary">Low Stock ({product.stock})</Badge>
                                    ) : (
                                        product.stock
                                    )}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => openForm(product)}>Edit</DropdownMenuItem>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the product from Supabase.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(product.id)}>Continue</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                )}
            </CardContent>
            <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>1-{decorProducts.length}</strong> of <strong>{decorProducts.length}</strong> products
                </div>
            </CardFooter>
        </Card>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-2xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{editingProduct?.id ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                        <DialogDescription>
                            {editingProduct?.id ? 'Update the details of this product.' : 'Add a new product to your catalog.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" name="name" defaultValue={editingProduct?.name} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">Category</Label>
                            <Input id="category" name="category" defaultValue={editingProduct?.category} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Price (TZS)</Label>
                            <Input id="price" name="price" type="number" defaultValue={editingProduct?.price} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="stock" className="text-right">Stock</Label>
                            <Input id="stock" name="stock" type="number" defaultValue={editingProduct?.stock} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="aiHint" className="text-right">AI Hint</Label>
                            <Input id="aiHint" name="aiHint" defaultValue={editingProduct?.aiHint} placeholder="e.g. linen pillow" className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">Images</Label>
                            <div className="col-span-3 space-y-2">
                               {Array.isArray(editingProduct?.image_urls) && editingProduct.image_urls.length > 0 && (
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">Current Images</Label>
                                  {editingProduct.image_urls.map((url, index) => (
                                    <div key={`existing-img-${index}`} className="flex items-center gap-2">
                                      <Button type="button" variant="outline" size="sm" className="w-full justify-start text-left font-normal truncate">
                                        {getFileName(url) || `Image ${index + 1}`}
                                      </Button>
                                      <img src={url} alt="preview" width={40} height={40} className="rounded-md object-cover"/>
                                      <Button variant="ghost" size="icon" onClick={() => removeImage('existing', index)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                  ))}
                                </div>
                               )}
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">New Images</Label>
                                    {imageFiles.map((file, index) => (
                                    <div key={`new-img-${index}`} className="flex items-center gap-2">
                                        <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, index)} className="w-full"/>
                                        {file && <img src={URL.createObjectURL(file)} alt="preview" width={40} height={40} className="rounded-md object-cover" />}
                                        <Button variant="ghost" size="icon" onClick={() => removeImage('new', index)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={addImageField} className="mt-2">
                                      <ImagePlus className="h-4 w-4 mr-2" /> Add Image
                                    </Button>
                                </div>
                            </div>
                        </div>

                         {isSubmitting && imageFiles.length > 0 && (
                            <div className="col-span-4">
                                <Progress value={uploadProgress} className="w-full" />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="secondary" onClick={closeForm} disabled={isSubmitting}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? `Saving...` : (editingProduct?.id ? 'Save Changes' : 'Add Product')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  )
}
