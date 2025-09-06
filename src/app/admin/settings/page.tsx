// src/app/admin/settings/page.tsx
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePavoData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { ImagePlus, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import type { SiteSettings } from '@/lib/types';
import { Progress } from '@/components/ui/progress';

type HeroImageKey = keyof SiteSettings['heroImages'];
type FounderImageKey = 'founder';

export default function SettingsAdminPage() {
  const { siteSettings, updateSiteSettings } = usePavoData();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<SiteSettings>(siteSettings);
  const [filesToUpload, setFilesToUpload] = useState<{[key: string]: File | null}>({});

  React.useEffect(() => {
    setLocalSettings(siteSettings);
  }, [siteSettings]);

  const handleBrandDescriptionChange = (brandName: 'interiors' | 'decors' | 'homes', value: string) => {
    setLocalSettings(prev => ({ ...prev, brandDescriptions: { ...prev.brandDescriptions, [brandName]: value } }));
  };
  
  const handleFounderInfoChange = (field: 'mainDescription' | 'philosophy', value: string) => {
    setLocalSettings(prev => ({ ...prev, founder: { ...prev.founder, [field]: value } }));
  };

  const handleImageFileChange = (key: string, file: File | null) => {
      setFilesToUpload(prev => ({ ...prev, [key]: file }));
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              // This is a complex way to update nested state.
              // A better approach might involve a more structured state management (e.g. using Immer)
              const parts = key.split('.');
              setLocalSettings(prev => {
                const newSettings = JSON.parse(JSON.stringify(prev)); // deep copy
                let current = newSettings;
                for (let i = 0; i < parts.length - 1; i++) {
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = reader.result as string;
                return newSettings;
              });
          };
          reader.readAsDataURL(file);
      }
  };


  const addHeroImageField = (key: HeroImageKey) => {
    const newHeroImages = { ...localSettings.heroImages };
    newHeroImages[key].push('');
    setLocalSettings(prev => ({ ...prev, heroImages: newHeroImages }));
  };

  const removeHeroImageField = (key: HeroImageKey, index: number) => {
    const newHeroImages = { ...localSettings.heroImages };
    newHeroImages[key].splice(index, 1);
    setLocalSettings(prev => ({ ...prev, heroImages: newHeroImages }));
  };
  
  const addFounderImageField = () => {
    setLocalSettings(prev => ({ ...prev, founder: { ...prev.founder, imageUrls: [...prev.founder.imageUrls, ''] } }));
  };

  const removeFounderImageField = (index: number) => {
    const newImageUrls = [...localSettings.founder.imageUrls];
    newImageUrls.splice(index, 1);
    setLocalSettings(prev => ({ ...prev, founder: { ...prev.founder, imageUrls: newImageUrls } }));
  };


  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real app, you would upload the files from `filesToUpload`
      // and get back the URLs before calling updateSiteSettings.
      // For this mock, we're just saving the text data.
      await updateSiteSettings(localSettings, filesToUpload);
      toast({
        title: "Settings Saved",
        description: "Your site content has been updated.",
      });
      setFilesToUpload({});
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'Could not save settings.' });
    }
    setIsSaving(false);
  };
  
  const getFileName = (url: string | null | undefined) => {
    if (!url) return null;
    try {
        // This is a simple heuristic, may not work for all URL formats
        const decodedUrl = decodeURIComponent(url);
        return decodedUrl.substring(decodedUrl.lastIndexOf('/') + 1).split('?')[0];
    } catch (e) {
      return "Invalid URL";
    }
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Site Settings</h1>
        <p className="text-muted-foreground">Manage the content displayed on your public-facing pages.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hero Images</CardTitle>
          <CardDescription>Manage the background images for the main public pages. Add multiple images for a slideshow effect.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(Object.keys(localSettings.heroImages) as HeroImageKey[]).map(key => (
            <div key={key} className="space-y-4 p-4 border rounded-lg">
                <Label className="text-lg font-semibold capitalize">{key === 'suite' ? 'Main Landing Page' : key}</Label>
                {localSettings.heroImages[key].map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="flex-grow relative">
                            <Input 
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageFileChange(`heroImages.${key}.${index}`, e.target.files?.[0] || null)}
                                className="opacity-0 absolute inset-0 w-full h-full z-10 cursor-pointer"
                            />
                            <Button type="button" variant="outline" className="w-full justify-start text-left font-normal truncate">
                                {filesToUpload[`heroImages.${key}.${index}`]?.name || getFileName(url) || `Select image ${index + 1}...`}
                            </Button>
                        </div>
                         <Image src={url || `https://placehold.co/40x40.png`} alt="preview" width={40} height={40} className="rounded-md object-cover"/>
                        <Button variant="ghost" size="icon" onClick={() => removeHeroImageField(key, index)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addHeroImageField(key)}>
                    <ImagePlus className="h-4 w-4 mr-2"/>
                    Add Image
                </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brand Descriptions</CardTitle>
          <CardDescription>Update the descriptions for each Pavo brand on the homepage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="interiorsDesc">Pavo Interiors</Label>
            <Textarea
              id="interiorsDesc"
              value={localSettings.brandDescriptions.interiors}
              onChange={(e) => handleBrandDescriptionChange('interiors', e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="decorsDesc">Pavo Decors</Label>
            <Textarea
              id="decorsDesc"
              value={localSettings.brandDescriptions.decors}
              onChange={(e) => handleBrandDescriptionChange('decors', e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="homesDesc">Pavo Homes</Label>
            <Textarea
              id="homesDesc"
              value={localSettings.brandDescriptions.homes}
              onChange={(e) => handleBrandDescriptionChange('homes', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>Founder Section</CardTitle>
          <CardDescription>Manage the content in the "About the Founder" section on the homepage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="founderMainDesc">Main Description</Label>
                <Textarea
                id="founderMainDesc"
                value={localSettings.founder.mainDescription}
                onChange={(e) => handleFounderInfoChange('mainDescription', e.target.value)}
                rows={4}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="founderPhilosophy">Pavo Philosophy</Label>
                <Textarea
                id="founderPhilosophy"
                value={localSettings.founder.philosophy}
                onChange={(e) => handleFounderInfoChange('philosophy', e.target.value)}
                rows={3}
                />
            </div>
            <div className="space-y-4">
                <Label>Founder Images</Label>
                {localSettings.founder.imageUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                       <div className="flex-grow relative">
                            <Input 
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageFileChange(`founder.imageUrls.${index}`, e.target.files?.[0] || null)}
                                className="opacity-0 absolute inset-0 w-full h-full z-10 cursor-pointer"
                            />
                            <Button type="button" variant="outline" className="w-full justify-start text-left font-normal truncate">
                               {filesToUpload[`founder.imageUrls.${index}`]?.name || getFileName(url) || `Select image ${index + 1}...`}
                            </Button>
                        </div>
                         <Image src={url || `https://placehold.co/40x40.png`} alt="preview" width={40} height={40} className="rounded-md object-cover"/>
                        <Button variant="ghost" size="icon" onClick={() => removeFounderImageField(index)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={addFounderImageField}>
                    <ImagePlus className="h-4 w-4 mr-2"/>
                    Add Image
                </Button>
            </div>
        </CardContent>
      </Card>


      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Save All Changes
        </Button>
      </div>
    </div>
  );
}
