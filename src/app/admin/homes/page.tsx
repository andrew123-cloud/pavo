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
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';

export default function HomesAdmin() {
  const { rentalProperties, loading, addOrUpdateRentalProperty, deleteRentalProperty } = usePavoData();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const openForm = (property?: Property) => {
    setEditingProperty(property || null);
    setImageFile(null);
    setUploadProgress(0);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setTimeout(() => {
        setEditingProperty(null);
        setImageFile(null);
        setUploadProgress(0);
    }, 300);
  };

  const uploadFile = (file: File, path: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            onProgress: (p: number) => {
                setUploadProgress(p / 2);
            },
        };

        try {
            const compressedFile = await imageCompression(file, options);
            const storageRef = ref(storage, path);
            const uploadTask = uploadBytesResumable(storageRef, compressedFile);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(50 + progress / 2);
                },
                (error) => {
                    console.error("Upload failed:", error);
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                }
            );
        } catch (error) {
            console.error("Compression or upload failed", error);
            reject(error);
        }
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setUploadProgress(0);
    
    const form = event.currentTarget;
    const title = form.title.value;
    const docId = editingProperty?.id || uuidv4();
    let imageUrl = editingProperty?.imageUrl || '';

    try {
      if (imageFile) {
        const filePath = `rentalProperties/${docId}/${imageFile.name}`;
        imageUrl = await uploadFile(imageFile, filePath);
      }

      const propertyData: Property = {
          id: docId,
          title,
          location: form.location.value,
          pricePerNight: Number(form.pricePerNight.value),
          rating: Number(form.rating.value),
          imageUrl,
          aiHint: title.toLowerCase().split(' ').slice(0, 2).join(' '),
      };

      await addOrUpdateRentalProperty(propertyData, docId);
      toast({ title: 'Success!', description: 'Property saved successfully.' });
      closeForm();
    } catch (error: any) {
      console.error("Error saving property:", error);
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRentalProperty(id);
      toast({
        title: 'Property Deleted',
        description: 'The property has been successfully deleted.',
      });
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
                <CardDescription>Manage your rental properties. Data is synced with Firestore.</CardDescription>
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
                                        src={property.imageUrl || 'https://placehold.co/64x64/png'}
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
                                                   This action cannot be undone. This will permanently delete the property from Firestore.
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

         <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
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
                            <Label htmlFor="rating" className="text-right">Rating</Label>
                            <Input id="rating" name="rating" type="number" step="0.1" max="5" min="0" defaultValue={editingProperty?.rating} className="col-span-3" required />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="imageFile" className="text-right">Image</Label>
                             <Input id="imageFile" name="imageFile" type="file" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="col-span-3" />
                        </div>
                         { (editingProperty?.imageUrl || imageFile) &&
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Preview</Label>
                                <Image
                                    src={imageFile ? URL.createObjectURL(imageFile) : editingProperty!.imageUrl}
                                    alt="preview"
                                    width={64}
                                    height={64}
                                    className="col-span-3 rounded-md object-cover"
                                />
                            </div>
                        }
                        {isSubmitting && (
                            <div className="col-span-4">
                                <Progress value={uploadProgress} />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="secondary" onClick={closeForm} disabled={isSubmitting}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             {isSubmitting ? `Uploading... ${Math.round(uploadProgress)}%` : (editingProperty ? 'Save Changes' : 'Add Property')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  )
}
