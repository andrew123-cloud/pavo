
// src/app/admin/booking-sites/page.tsx
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
import { Textarea } from '@/components/ui/textarea';
import type { BookingSite } from '@/lib/types';
import { usePavoData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

type ImageFileWithPreview = {
    file: File;
    preview: string;
};

export default function BookingSitesAdmin() {
  const { bookingSites, loading, addOrUpdateBookingSite, deleteBookingSite } = usePavoData();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSite, setEditingSite] = useState<Partial<BookingSite> | null>(null);
  const [imageFiles, setImageFiles] = useState<ImageFileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const openForm = (site?: BookingSite) => {
    setEditingSite(site || { imageUrls: [] });
    setImageFiles([]);
    setUploadProgress(0);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setTimeout(() => {
      setEditingSite(null);
      setImageFiles([]);
      setUploadProgress(0);
    }, 300);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const filesWithPreview = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setImageFiles(prev => [...prev, ...filesWithPreview]);
  };
  
  const removeImage = (index: number, type: 'new' | 'existing') => {
      if (type === 'new') {
          setImageFiles(prev => prev.filter((_, i) => i !== index));
      } else if (type === 'existing' && editingSite) {
          const updatedUrls = [...(editingSite.imageUrls || [])];
          updatedUrls.splice(index, 1);
          setEditingSite(prev => ({...prev, imageUrls: updatedUrls}));
      }
  };


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingSite) return;
    setIsSubmitting(true);
    setUploadProgress(0);

    const form = event.currentTarget;
    
    try {
      const siteData: Partial<BookingSite> = {
          ...editingSite,
          name: form.name.value,
          type: form.type.value,
          description: form.description.value,
          location: form.location.value,
          priceInfo: form.priceInfo.value,
          aiHint: form.aiHint.value,
      };
      
      const filesToUpload = imageFiles.map(f => f.file);
      await addOrUpdateBookingSite(siteData, filesToUpload, setUploadProgress);

      toast({ title: 'Success!', description: 'Booking site saved successfully.' });
      closeForm();

    } catch (error: any) {
        console.error("Error saving booking site:", error);
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'An unknown error occurred' });
    } finally {
        setIsSubmitting(false);
        setUploadProgress(0);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteBookingSite(id);
      toast({
        title: 'Booking Site Deleted',
        description: 'The listing has been successfully deleted.',
      });
    } catch (error) {
       // Error toast is handled by context
    }
  };
  
  const renderImagePreviews = (
      existingUrls: string[] = [], 
      newFiles: ImageFileWithPreview[] = []
    ) => {
    const allImages = [...existingUrls.map(url => typeof url === 'string' && url.trim() ? url : null).filter(Boolean) as string[], ...newFiles.map(f => f.preview)];
    if (allImages.length === 0) return null;

    return (
        <Carousel className="w-full max-w-xs">
            <CarouselContent>
                {existingUrls.map((url, index) => (
                    <CarouselItem key={`existing-${index}`}>
                        <div className="relative aspect-square">
                            <img src={url} alt="preview" className="absolute inset-0 w-full h-full rounded-md object-cover"/>
                            <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeImage(index, 'existing')}><Trash2 className="h-4 w-4"/></Button>
                        </div>
                    </CarouselItem>
                ))}
                {newFiles.map((file, index) => (
                     <CarouselItem key={`new-${index}`}>
                        <div className="relative aspect-square">
                           <img src={file.preview} alt="preview" className="absolute inset-0 w-full h-full rounded-md object-cover"/>
                           <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeImage(index, 'new')}><Trash2 className="h-4 w-4"/></Button>
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
            <h1 className="font-headline text-3xl font-bold">Booking Sites</h1>
            <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => openForm()}>
                    <PlusCircle className="h-4 w-4 mr-2"/>
                    Add Site
                </Button>
            </div>
        </div>
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Listings</CardTitle>
                <CardDescription>Manage your bookable homes, restaurants, and catering services.</CardDescription>
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
                            <TableHead>Type</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bookingSites.map(site => (
                            <TableRow key={site.id}>
                                <TableCell className="hidden sm:table-cell">
                                    <img
                                        alt={site.name}
                                        className="aspect-square rounded-md object-cover"
                                        height="64"
                                        src={site.imageUrls && typeof site.imageUrls[0] === 'string' && site.imageUrls[0].trim() ? site.imageUrls[0] : 'https://placehold.co/64x64/png'}
                                        width="64"
                                        data-ai-hint={site.aiHint}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{site.name}</TableCell>
                                <TableCell className="capitalize">{site.type}</TableCell>
                                <TableCell>{site.location}</TableCell>
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
                                        <DropdownMenuItem onClick={() => openForm(site)}>Edit</DropdownMenuItem>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete this listing.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(site.id)}>Continue</AlertDialogAction>
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
                    Showing <strong>1-{bookingSites.length}</strong> of <strong>{bookingSites.length}</strong> sites
                </div>
            </CardFooter>
        </Card>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-2xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{editingSite?.id ? 'Edit Site' : 'Add New Site'}</DialogTitle>
                        <DialogDescription>
                            {editingSite?.id ? 'Update the details of this bookable site.' : 'Add a new site to your bookings page.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" name="name" defaultValue={editingSite?.name} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">Type</Label>
                            <Select name="type" defaultValue={editingSite?.type} required>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="home">Home</SelectItem>
                                    <SelectItem value="restaurant">Restaurant</SelectItem>
                                    <SelectItem value="caterer">Caterer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right pt-2">
                                Description
                            </Label>
                            <Textarea id="description" name="description" defaultValue={editingSite?.description} className="col-span-3" rows={3} required/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="location" className="text-right">Location</Label>
                            <Input id="location" name="location" defaultValue={editingSite?.location} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="priceInfo" className="text-right">Price Info</Label>
                            <Input id="priceInfo" name="priceInfo" defaultValue={editingSite?.priceInfo} placeholder="e.g. $200 / night" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="aiHint" className="text-right">AI Hint</Label>
                            <Input id="aiHint" name="aiHint" defaultValue={editingSite?.aiHint} placeholder="e.g. modern villa" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="imageFile" className="text-right pt-2">Images</Label>
                            <div className="col-span-3 space-y-2">
                               <Input id="imageFile" name="imageFile" type="file" multiple onChange={handleFileChange} className="col-span-3" />
                               {renderImagePreviews(editingSite?.imageUrls, imageFiles)}
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
                            {isSubmitting ? `Saving...` : (editingSite?.id ? 'Save Changes' : 'Add Site')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  )
}
