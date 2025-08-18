
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import Image from "next/image";
import { decorProducts as initialDecorProducts } from "@/lib/data";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Product } from '@/lib/types';

export default function DecorsAdmin() {
  const [decorProducts, setDecorProducts] = useState(initialDecorProducts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const openDialog = (product?: Product) => {
    setEditingProduct(product || null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setEditingProduct(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : String(Date.now()),
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      price: Number(formData.get('price')),
      imageUrl: editingProduct?.imageUrl || '/photos/placeholder.jpg',
      aiHint: editingProduct?.aiHint || formData.get('name')?.toString().toLowerCase().split(' ').slice(0,2).join(' ') || 'new decor',
    };

    if (editingProduct) {
      setDecorProducts(decorProducts.map(p => p.id === newProduct.id ? newProduct : p));
    } else {
      setDecorProducts([...decorProducts, newProduct]);
    }
    closeDialog();
  };

  const handleDelete = (id: string) => {
    setDecorProducts(decorProducts.filter(p => p.id !== id));
  };

  return (
    <div>
        <div className="flex items-center">
            <h1 className="font-headline text-3xl font-bold">Decor Products</h1>
            <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => openDialog()}>
                    <PlusCircle className="h-4 w-4 mr-2"/>
                    Add Product
                </Button>
            </div>
        </div>
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>Manage your decor products.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
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
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem>View Details</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openDialog(product)}>Edit</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(product.id)}>Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>1-{decorProducts.length}</strong> of <strong>{decorProducts.length}</strong> products
                </div>
            </CardFooter>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                            <Input id="name" name="name" defaultValue={editingProduct?.name} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">Category</Label>
                            <Input id="category" name="category" defaultValue={editingProduct?.category} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Price (TZS)</Label>
                            <Input id="price" name="price" type="number" defaultValue={editingProduct?.price} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">{editingProduct ? 'Save Changes' : 'Add Product'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  )
}
