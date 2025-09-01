// src/app/admin/homes/page.tsx
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, Star, Loader2 } from "lucide-react";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Property } from '@/lib/types';
import { usePavoData } from '@/context/data-context';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import imageCompression from 'browser-image-compression';

export default function HomesAdmin() {
  const { rentalProperties, addRentalProperty, updateRentalProperty, deleteRentalProperty, loading } = usePavoData();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const openForm = (property?: Property) => {
    setEditingProperty(property || null);
    setImageFile(null);
    setImagePreview(property?.imageUrl || null);
    setUploadProgress(0);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingProperty(null);
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
    setIsSubmitting(false);
    setIsFormOpen(false);
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
       const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      }
      try {
        const compressedFile = await imageCompression(file, options);
        setImageFile(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
      } catch (error) {
        console.error('Error compressing image:', error);
        setImageFile(file); // Fallback to original file
        setImagePreview(URL.createObjectURL(file));
        toast({
          variant: 'destructive',
          title: 'Image Compression Failed',
          description: 'The original image will be used, which may result in a slower upload.',
        });
      }
    }
  };

  const uploadImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      setUploadProgress(0);
      const storageRef = ref(storage, `rental-properties/${Date.now()}-${file.name}`);
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
    let imageUrl = editingProperty?.imageUrl;

    try {
      if (imageFile) {
        toast({ title: 'Uploading image...' });
        imageUrl = await uploadImage(imageFile);
      }

      if (!imageUrl) {
        toast({ variant: 'destructive', title: 'Image Required', description: 'Please select an image for the property.' });
        return;
      }

      const propertyData = {
        title: formData.get('title') as string,
        location: formData.get('location') as string,
        pricePerNight: Number(formData.get('pricePerNight')),
        rating: editingProperty?.rating || 0, // Keep existing rating or default to 0
        imageUrl: imageUrl!,
        aiHint: (formData.get('title') as string).toLowerCase().split(' ').slice(0,2).join(' ') || 'new home',
      };

      if (editingProperty) {
        await updateRentalProperty({ ...propertyData, id: editingProperty.id });
      } else {
        await addRentalProperty(propertyData);
      }
      closeForm();
    } catch (error) {
      console.error("Error saving property:", error);
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the property. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRentalProperty(id);
    } catch (error) {
      // Error toast is handled by context
    }
  };

  return (
    <div>
        <div className="flex items-center">
            <h1 className="font-headline text-3xl font-bold">Rental Properties</h1>
            <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => openForm()}>
                    <PlusCircle className="h-4 w-4 mr-2"/>
                    Add Property
                </Button>
            </div>
        </div>
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Properties</CardTitle>
                <CardDescription>Manage your rental properties.</CardDescription>
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
                            <TableHead>Rating</TableHead>
                            <TableHead>Price/Night</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rentalProperties.map(property => (
                            <TableRow key={property.id}>
                                <TableCell className="hidden sm:table-cell">
                                    <Image
                                        alt={property.title}
                                        className="aspect-square rounded-md object-cover"
                                        height="64"
                                        src={property.imageUrl}
                                        width="64"
                                        data-ai-hint={property.aiHint}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{property.title}</TableCell>
                                <TableCell>{property.location}</TableCell>
                                <TableCell>
                                    <div className="flex items-center">
                                        {property.rating} <Star className="h-4 w-4 ml-1 text-yellow-400 fill-yellow-400"/>
                                    </div>
                                </TableCell>
                                <TableCell>{property.pricePerNight.toLocaleString()} TZS</TableCell>
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
                                        <DropdownMenuItem onClick={() => openForm(property)}>Edit</DropdownMenuItem>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the property.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(property.id)}>Continue</AlertDialogAction>
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
                    Showing <strong>1-{rentalProperties.length}</strong> of <strong>{rentalProperties.length}</strong> properties
                </div>
            </CardFooter>
        </Card>

         <Dialog open={isFormOpen} onOpenChange={(open) => !isSubmitting && setIsFormOpen(open)}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{editingProperty ? 'Edit Property' : 'Add New Property'}</DialogTitle>
                        <DialogDescription>
                            {editingProperty ? 'Update the details of this rental property.' : 'Add a new rental property to your listings.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">Title</Label>
                            <Input id="title" name="title" defaultValue={editingProperty?.title} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="location" className="text-right">Location</Label>
                            <Input id="location" name="location" defaultValue={editingProperty?.location} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="pricePerNight" className="text-right">Price/Night (TZS)</Label>
                            <Input id="pricePerNight" name="pricePerNight" type="number" defaultValue={editingProperty?.pricePerNight} className="col-span-3" required />
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
                                    <span className="text-xs text-muted-foreground">Compressing & Uploading...</span>
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
                            {editingProperty ? 'Save Changes' : 'Add Property'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  )
}
