
// src/app/admin/interiors/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, Loader2, Trash2, ImagePlus } from "lucide-react";
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

export default function InteriorsAdmin() {
  const { portfolioItems, loading, addOrUpdatePortfolioItem, deletePortfolioItem } = usePavoData();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<PortfolioItem> | null>(null);
  const [beforeImageFiles, setBeforeImageFiles] = useState<(File | null)[]>([]);
  const [afterImageFiles, setAfterImageFiles] = useState<(File | null)[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      [...beforeImageFiles, ...afterImageFiles].forEach((file) => {
        if (file) URL.revokeObjectURL(URL.createObjectURL(file));
      });
    };
  }, [beforeImageFiles, afterImageFiles]);

  const openForm = (item?: PortfolioItem) => {
    setEditingItem(item || { imageUrls: [], beforeImageUrls: [] });
    setBeforeImageFiles([]);
    setAfterImageFiles([]);
    setUploadProgress(0);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setTimeout(() => {
      setEditingItem(null);
      setBeforeImageFiles([]);
      setAfterImageFiles([]);
      setUploadProgress(0);
    }, 300);
  };

  const addBeforeImageField = () => setBeforeImageFiles(prev => [...prev, null]);
  const addAfterImageField = () => setAfterImageFiles(prev => [...prev, null]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after', index: number) => {
    const file = e.target.files?.[0] || null;
    if (type === 'before') {
      const newFiles = [...beforeImageFiles];
      newFiles[index] = file;
      setBeforeImageFiles(newFiles);
    } else {
      const newFiles = [...afterImageFiles];
      newFiles[index] = file;
      setAfterImageFiles(newFiles);
    }
  };

  const removeImage = (type: 'existing-before' | 'existing-after' | 'new-before' | 'new-after', index: number) => {
    if (type === 'new-before') {
      setBeforeImageFiles(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'new-after') {
      setAfterImageFiles(prev => prev.filter((_, i) => i !== index));
    } else if (editingItem) {
      const currentItem = { ...editingItem };
      if (type === 'existing-before') {
        currentItem.beforeImageUrls = currentItem.beforeImageUrls?.filter((_, i) => i !== index);
      } else if (type === 'existing-after') {
        currentItem.imageUrls = currentItem.imageUrls?.filter((_, i) => i !== index);
      }
      setEditingItem(currentItem);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingItem) return;
    setIsSubmitting(true);
    setUploadProgress(0);

    const formData = new FormData(event.currentTarget);

    try {
      const portfolioData: Partial<PortfolioItem> = {
        ...editingItem,
        title: formData.get("title") as string,
        location: formData.get("location") as string,
        description: formData.get("description") as string,
        aiHint: formData.get("aiHint") as string,
      };

      const finalBeforeFiles = beforeImageFiles.filter((f): f is File => f !== null);
      const finalAfterFiles = afterImageFiles.filter((f): f is File => f !== null);

      await addOrUpdatePortfolioItem(portfolioData, finalBeforeFiles, finalAfterFiles, setUploadProgress);

      toast({ title: 'Success!', description: 'Portfolio item saved successfully.' });
      closeForm();
    } catch (error: any) {
      console.error("Error saving portfolio item:", error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error.message || 'An unknown error occurred.',
      });
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
    } catch (e) {
      // Error toast handled by context
    }
  };

  const getFileName = (url: string | null | undefined) => {
    if (!url || typeof url !== 'string') return null;
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
        <h1 className="font-headline text-3xl font-bold">Interiors Portfolio</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => openForm()}>
            <PlusCircle className="h-4 w-4 mr-2" />
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
                        src={item.imageUrls?.[0] && typeof item.imageUrls[0] === 'string' && item.imageUrls[0].trim()
                          ? item.imageUrls[0]
                          : 'https://placehold.co/64x64/png?text=No+Image'}
                        width="64"
                        data-ai-hint={item.aiHint}
                        style={{ aspectRatio: '1 / 1' }}
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
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" name="title" defaultValue={editingItem?.title} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">Location</Label>
                <Input id="location" name="location" defaultValue={editingItem?.location} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="aiHint" className="text-right">AI Hint</Label>
                <Input id="aiHint" name="aiHint" defaultValue={editingItem?.aiHint} placeholder="e.g. modern living room" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">Description</Label>
                <Textarea id="description" name="description" defaultValue={editingItem?.description} className="col-span-3" rows={4} required />
              </div>

              {/* Before Images */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">'Before' Images</Label>
                <div className="col-span-3 space-y-2">
                  {editingItem?.beforeImageUrls && editingItem.beforeImageUrls.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Current Images</Label>
                      {editingItem.beforeImageUrls.map((url, index) => (
                        <div key={`existing-before-${url}-${index}`} className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" className="w-full justify-start text-left font-normal truncate">
                            {getFileName(url) || `Image ${index + 1}`}
                          </Button>
                          <Image
                            src={typeof url === 'string' && url.trim() ? url : 'https://placehold.co/40x40.png'}
                            alt="preview"
                            width={40}
                            height={40}
                            className="rounded-md object-cover"
                          />
                          <Button variant="ghost" size="icon" onClick={() => removeImage('existing-before', index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">New Images</Label>
                    {beforeImageFiles.map((file, index) => (
                      <div key={`new-before-${index}`} className="flex items-center gap-2">
                        <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'before', index)} className="col-span-3" />
                        {file && <Image src={URL.createObjectURL(file)} alt="preview" width={40} height={40} className="rounded-md object-cover" />}
                        <Button variant="ghost" size="icon" onClick={() => removeImage('new-before', index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addBeforeImageField} className="mt-2">
                      <ImagePlus className="h-4 w-4 mr-2" /> Add 'Before' Image
                    </Button>
                  </div>
                </div>
              </div>

              {/* After Images */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">'After' Images</Label>
                <div className="col-span-3 space-y-2">
                  {editingItem?.imageUrls && editingItem.imageUrls.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Current Images</Label>
                      {editingItem.imageUrls.map((url, index) => (
                        <div key={`existing-after-${url}-${index}`} className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" className="w-full justify-start text-left font-normal truncate">
                            {getFileName(url) || `Image ${index + 1}`}
                          </Button>
                          <Image
                            src={typeof url === 'string' && url.trim() ? url : 'https://placehold.co/40x40.png'}
                            alt="preview"
                            width={40}
                            height={40}
                            className="rounded-md object-cover"
                          />
                          <Button variant="ghost" size="icon" onClick={() => removeImage('existing-after', index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">New Images</Label>
                    {afterImageFiles.map((file, index) => (
                      <div key={`new-after-${index}`} className="flex items-center gap-2">
                        <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'after', index)} className="col-span-3" />
                        {file && <Image src={URL.createObjectURL(file)} alt="preview" width={40} height={40} className="rounded-md object-cover" />}
                        <Button variant="ghost" size="icon" onClick={() => removeImage('new-after', index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addAfterImageField} className="mt-2">
                      <ImagePlus className="h-4 w-4 mr-2" /> Add 'After' Image
                    </Button>
                  </div>
                </div>
              </div>

              {isSubmitting && (beforeImageFiles.filter(f => f).length > 0 || afterImageFiles.filter(f => f).length > 0) && (
                <div className="col-span-4">
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" onClick={closeForm} disabled={isSubmitting}>
                  Cancel
                </Button>
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
  );
}
