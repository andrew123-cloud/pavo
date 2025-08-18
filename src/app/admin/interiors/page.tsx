
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import Image from "next/image";
import { portfolioItems as initialPortfolioItems } from "@/lib/data";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PortfolioItem } from '@/lib/types';

export default function InteriorsAdmin() {
  const [portfolioItems, setPortfolioItems] = useState(initialPortfolioItems);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);

  const openDialog = (item?: PortfolioItem) => {
    setEditingItem(item || null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newItem: PortfolioItem = {
      id: editingItem ? editingItem.id : String(Date.now()),
      title: formData.get('title') as string,
      location: formData.get('location') as string,
      imageUrl: editingItem?.imageUrl || 'https://placehold.co/600x400.png', // Placeholder for new items
      aiHint: editingItem?.aiHint || formData.get('title')?.toString().toLowerCase().split(' ').slice(0,2).join(' ') || "new interior"
    };

    if (editingItem) {
      setPortfolioItems(portfolioItems.map(item => item.id === newItem.id ? newItem : item));
    } else {
      setPortfolioItems([...portfolioItems, newItem]);
    }
    closeDialog();
  };

  const handleDelete = (id: string) => {
    setPortfolioItems(portfolioItems.filter(item => item.id !== id));
  };


  return (
    <div>
        <div className="flex items-center">
            <h1 className="font-headline text-3xl font-bold">Interiors Portfolio</h1>
            <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => openDialog()}>
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
                                        <DropdownMenuItem>View Details</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openDialog(item)}>Edit</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(item.id)}>Delete</DropdownMenuItem>
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
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
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">{editingItem ? 'Save Changes' : 'Add Item'}</Button>
                    </DialogFooter>
                 </form>
            </DialogContent>
        </Dialog>
    </div>
  )
}
