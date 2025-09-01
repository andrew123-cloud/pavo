// src/app/admin/decors/page.tsx
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Product } from '@/lib/types';
import { usePavoData } from '@/context/data-context';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export default function DecorsAdmin() {
  const { decorProducts, addDecorProduct, updateDecorProduct, deleteDecorProduct, loading } = usePavoData();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const openForm = (product?: Product) => {
    setEditingProduct(product || null);
    setImageFile(null);
    setImagePreview(product?.imageUrl || null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
    setIsSubmitting(false);
    setIsFormOpen(false);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      setUploadProgress(0);
      const storageRef = ref(storage, `decor-products/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setUploadProgress(100);
            resolve(downloadURL);
          });
        }
      );
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    let imageUrl = editingProduct?.imageUrl;

    try {
      if (imageFile) {
        toast({ title: 'Uploading image...', description: 'Please wait.' });
        imageUrl = await uploadImage(imageFile);
      }

      if (!imageUrl && !editingProduct) {
        toast({ variant: 'destructive', title: 'Image Required', description: 'Please select an image for the product.' });
        return; // Early return
      }
      
      const productData = {
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        price: Number(formData.get('price')),
        stock: Number(formData.get('stock')),
        imageUrl: imageUrl!,
        aiHint: (formData.get('name') as string).toLowerCase().split(' ').slice(0,2).join(' ') || 'new decor',
      };

      if (editingProduct) {
        await updateDecorProduct({ ...productData, id: editingProduct.id });
      } else {
        await addDecorProduct(productData);
      }
      
      closeForm(); // Close form only on success

    } catch (error) {
      // Error toast is handled by the context, but we can log it here too.
      console.error("Error saving product:", error);
    } finally {
      // This will run whether the try block succeeded or failed.
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDecorProduct(id);
    } catch (error) {
       // Error toast is handled by context
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
                <CardDescription>Manage your decor products and inventory.</CardDescription>
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
                                    <Image
                                        alt={product.name}
                                        className="aspect-square rounded-md object-cover"
                                        height="64"
                                        src={product.imageUrl}
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
                                                    This action cannot be undone. This will permanently delete the product.
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

        <Dialog open={isFormOpen} onOpenChange={(open) => !isSubmitting && setIsFormOpen(open)}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                        <DialogDescription>
                            {editingProduct ? 'Update the details of this product.' : 'Add a new product to your catalog.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
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
                            <Label htmlFor="image" className="text-right">Image</Label>
                            <Input id="image" name="image" type="file" accept="image/*" onChange={handleImageChange} className="col-span-3" />
                        </div>
                         {imagePreview && (
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right pt-2">Preview</Label>
                                <div className="col-span-3">
                                     <Image src={imagePreview} alt="Image preview" width={100} height={100} className="rounded-md object-cover"/>
                                </div>
                            </div>
                        )}
                        {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Progress</Label>
                                <div className="col-span-3">
                                    <Progress value={uploadProgress} />
                                </div>
                             </div>
                        )}
                    </div>
                    <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="secondary" onClick={closeForm} disabled={isSubmitting}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingProduct ? 'Save Changes' : 'Add Product'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  )
}
