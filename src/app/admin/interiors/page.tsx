// src/app/admin/interiors/page.tsx
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PortfolioItem } from '@/lib/types';
import { usePavoData } from '@/context/data-context';
import { Textarea } from '@/components/ui/textarea';

export default function InteriorsAdmin() {
  const { portfolioItems, addPortfolioItem, updatePortfolioItem, deletePortfolioItem } = usePavoData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [beforeImagePreview, setBeforeImagePreview] = useState<string | null>(null);


  const openForm = (item?: PortfolioItem) => {
    setEditingItem(item || null);
    setImagePreview(item?.imageUrl || null);
    setBeforeImagePreview(item?.beforeImageUrl || null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingItem(null);
    setImagePreview(null);
    setBeforeImagePreview(null);
    setIsFormOpen(false);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'after' | 'before') => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'after') {
            setImagePreview(reader.result as string);
        } else {
            setBeforeImagePreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newItem: PortfolioItem = {
      id: editingItem ? editingItem.id : String(Date.now()),
      title: formData.get('title') as string,
      location: formData.get('location') as string,
      description: formData.get('description') as string,
      imageUrl: imagePreview || editingItem?.imageUrl || 'https://placehold.co/600x400.png',
      beforeImageUrl: beforeImagePreview || editingItem?.beforeImageUrl || 'https://placehold.co/600x400.png',
      aiHint: editingItem?.aiHint || formData.get('title')?.toString().toLowerCase().split(' ').slice(0,2).join(' ') || "new interior"
    };

    if (editingItem) {
      updatePortfolioItem(newItem);
    } else {
      addPortfolioItem(newItem);
    }
    closeForm();
  };

  const handleDelete = (id: string) => {
    deletePortfolioItem(id);
  };

  return (
    <div>
        <div className="flex items-center">
            <h1 className="font-headline text-3xl font-bold">Interiors Portfolio</h1>
            <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => openForm()}>
                    <PlusCircle className="h-4 w-4 mr-2"/>
                    Add Portfolio Item
                </Button>
            </div>
        </div>
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Portfolio Items</CardTitle>
                <CardDescription>Manage your interior design portfolio.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {portfolioItems.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="hidden sm:table-cell">
                                    <Image
                                        alt={item.title}
                                        className="aspect-square rounded-md object-cover"
                                        height="64"
                                        src={item.imageUrl}
                                        width="64"
                                        data-ai-hint={item.aiHint}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{item.title}</TableCell>
                                <TableCell>{item.location}</TableCell>
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
                                        <DropdownMenuItem onClick={() => openForm(item)}>Edit</DropdownMenuItem>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the portfolio item.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(item.id)}>Continue</AlertDialogAction>
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
            </CardContent>
            <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>1-{portfolioItems.length}</strong> of <strong>{portfolioItems.length}</strong> items
                </div>
            </CardFooter>
        </Card>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-2xl">
                 <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Portfolio Item' : 'Add New Portfolio Item'}</DialogTitle>
                        <DialogDescription>
                            {editingItem ? 'Update the details of your portfolio item.' : 'Add a new project to your portfolio.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">
                                Title
                            </Label>
                            <Input id="title" name="title" defaultValue={editingItem?.title} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="location" className="text-right">
                                Location
                            </Label>
                            <Input id="location" name="location" defaultValue={editingItem?.location} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right pt-2">
                                Description
                            </Label>
                            <Textarea id="description" name="description" defaultValue={editingItem?.description} className="col-span-3" rows={4} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="beforeImage" className="text-right">
                                Before Image
                            </Label>
                            <Input id="beforeImage" name="beforeImage" type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'before')} className="col-span-3" />
                        </div>
                         {beforeImagePreview && (
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right pt-2">Preview</Label>
                                <div className="col-span-3">
                                     <Image src={beforeImagePreview} alt="Before image preview" width={100} height={100} className="rounded-md object-cover"/>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="afterImage" className="text-right">
                                After Image
                            </Label>
                            <Input id="afterImage" name="afterImage" type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'after')} className="col-span-3" />
                        </div>
                         {imagePreview && (
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right pt-2">Preview</Label>
                                <div className="col-span-3">
                                     <Image src={imagePreview} alt="After image preview" width={100} height={100} className="rounded-md object-cover"/>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary" onClick={closeForm}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit">{editingItem ? 'Save Changes' : 'Add Item'}</Button>
                    </DialogFooter>
                 </form>
            </DialogContent>
        </Dialog>
    </div>
  )
}
