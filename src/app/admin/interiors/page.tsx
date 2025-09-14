// src/app/admin/interiors/page.tsx
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PortfolioItem } from '@/lib/types';
import { usePavoData } from '@/context/data-context';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

type ImageFileWithPreview = {
    file: File;
    preview: string;
};

export default function InteriorsAdmin() {
  const { portfolioItems, loading, addOrUpdatePortfolioItem, deletePortfolioItem } = usePavoData();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<PortfolioItem> | null>(null);
  const [imageFiles, setImageFiles] = useState<ImageFileWithPreview[]>([]);
  const [beforeImageFiles, setBeforeImageFiles] = useState<ImageFileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const openForm = (item?: PortfolioItem) => {
    setEditingItem(item || { imageUrls: [], beforeImageUrls: [] });
    setImageFiles([]);
    setBeforeImageFiles([]);
    setUploadProgress(0);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setTimeout(() => {
        setEditingItem(null);
        setImageFiles([]);
        setBeforeImageFiles([]);
        setUploadProgress(0);
    }, 300);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const files = Array.from(e.target.files || []);
    const filesWithPreview = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    if (type === 'before') {
      setBeforeImageFiles(prev => [...prev, ...filesWithPreview]);
    } else {
      setImageFiles(prev => [...prev, ...filesWithPreview]);
    }
  };

  const removeImage = (index: number, type: 'before' | 'after' | 'existing-before' | 'existing-after') => {
      if (type === 'before') {
          setBeforeImageFiles(prev => prev.filter((_, i) => i !== index));
      } else if (type === 'after') {
          setImageFiles(prev => prev.filter((_, i) => i !== index));
      } else if (type === 'existing-before' && editingItem) {
          const updatedUrls = [...(editingItem.beforeImageUrls || [])];
          updatedUrls.splice(index, 1);
          setEditingItem(prev => ({...prev, beforeImageUrls: updatedUrls}));
      } else if (type === 'existing-after' && editingItem) {
          const updatedUrls = [...(editingItem.imageUrls || [])];
          updatedUrls.splice(index, 1);
          setEditingItem(prev => ({...prev, imageUrls: updatedUrls}));
      }
  };
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingItem) return;
    setIsSubmitting(true);
    setUploadProgress(0);
    
    const form = event.currentTarget;

    try {
      const portfolioData: Partial<PortfolioItem> = {
        ...editingItem,
        title: form.title.value,
        location: form.location.value,
        description: form.description.value,
      };

      const beforeFiles = beforeImageFiles.map(f => f.file);
      const afterFiles = imageFiles.map(f => f.file);
      
      await addOrUpdatePortfolioItem(portfolioData, beforeFiles, afterFiles, setUploadProgress);

      toast({ title: 'Success!', description: 'Portfolio item saved successfully.' });
      closeForm();
    } catch (error: any) {
      console.error("Error saving portfolio item:", error);
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'An unknown error occurred.' });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePortfolioItem(id);
      toast({
        title: 'Portfolio Item Deleted',
        description: 'The item has been successfully deleted.',
      });
    } catch(e) {
      // Error toast is handled by context
    }
  };

  const renderImagePreviews = (
      existingUrls: string[] = [], 
      newFiles: ImageFileWithPreview[] = [], 
      type: 'existing-before' | 'existing-after' | 'before' | 'after'
    ) => {
    const allImages = [...existingUrls, ...newFiles.map(f => f.preview)];
    if (allImages.length === 0) return null;

    return (
        <Carousel className="w-full max-w-xs">
            <CarouselContent>
                {existingUrls.map((url, index) => (
                    <CarouselItem key={`existing-${index}`}>
                        <div className="relative aspect-square">
                            <Image src={url} alt="preview" fill className="rounded-md object-cover"/>
                            <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeImage(index, type.startsWith('existing') ? type : (type as 'before' | 'after'))}><Trash2 className="h-4 w-4"/></Button>
                        </div>
                    </CarouselItem>
                ))}
                {newFiles.map((file, index) => (
                     <CarouselItem key={`new-${index}`}>
                        <div className="relative aspect-square">
                           <Image src={file.preview} alt="preview" fill className="rounded-md object-cover"/>
                           <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeImage(index, type.startsWith('existing-') ? type : (type as 'before' | 'after'))}><Trash2 className="h-4 w-4"/></Button>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            {allImages.length > 1 && <>
              <CarouselPrevious />
              <CarouselNext />
            </>}
        </Carousel>
    );
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
                <CardDescription>Manage your interior design portfolio. Data is synced with Supabase.</CardDescription>
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
                                        src={item.imageUrls?.[0] || 'https://placehold.co/64x64/png'}
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
                )}
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
                        <DialogTitle>{editingItem?.id ? 'Edit Portfolio Item' : 'Add New Portfolio Item'}</DialogTitle>
                        <DialogDescription>
                            {editingItem?.id ? 'Update the details of your portfolio item.' : 'Add a new project to your portfolio.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">
                                Title
                            </Label>
                            <Input id="title" name="title" defaultValue={editingItem?.title} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="location" className="text-right">
                                Location
                            </Label>
                            <Input id="location" name="location" defaultValue={editingItem?.location} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right pt-2">
                                Description
                            </Label>
                            <Textarea id="description" name="description" defaultValue={editingItem?.description} className="col-span-3" rows={4} required/>
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="beforeImageFile" className="text-right pt-2">
                                'Before' Images
                            </Label>
                            <div className="col-span-3 space-y-2">
                              <Input 
                                  id="beforeImageFile" 
                                  name="beforeImageFile" 
                                  type="file"
                                  multiple
                                  onChange={(e) => handleFileChange(e, 'before')}
                                  className="col-span-3"
                              />
                              {renderImagePreviews(editingItem?.beforeImageUrls, beforeImageFiles, 'existing-before')}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="imageFile" className="text-right pt-2">
                                'After' Images
                            </Label>
                             <div className="col-span-3 space-y-2">
                                <Input 
                                    id="imageFile" 
                                    name="imageFile" 
                                    type="file"
                                    multiple
                                    onChange={(e) => handleFileChange(e, 'after')}
                                    className="col-span-3" 
                                />
                               {renderImagePreviews(editingItem?.imageUrls, imageFiles, 'existing-after')}
                            </div>
                        </div>
                        {isSubmitting && (beforeImageFiles.length > 0 || imageFiles.length > 0) && (
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
                           {isSubmitting ? 'Saving...' : (editingItem?.id ? 'Save Changes' : 'Add Item')}
                        </Button>
                    </DialogFooter>
                 </form>
            </DialogContent>
        </Dialog>
    </div>
  )
}
