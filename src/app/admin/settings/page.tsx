
// src/app/admin/settings/page.tsx
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePavoData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { ImagePlus, Trash2 } from 'lucide-react';
import Image from 'next/image';

export default function SettingsAdminPage() {
  const { siteSettings, updateSiteSettings } = usePavoData();
  const { toast } = useToast();

  const handleBrandDescriptionChange = (brandName: 'interiors' | 'decors' | 'homes', value: string) => {
    const newSettings = { ...siteSettings };
    newSettings.brandDescriptions[brandName] = value;
    updateSiteSettings(newSettings);
  };
  
  const handleFounderInfoChange = (field: 'mainDescription' | 'philosophy', value: string) => {
    const newSettings = { ...siteSettings };
    newSettings.founder[field] = value;
    updateSiteSettings(newSettings);
  };

  const handleImageChange = (index: number, value: string) => {
    const newSettings = { ...siteSettings };
    newSettings.founder.imageUrls[index] = value;
    updateSiteSettings(newSettings);
  };

  const addImageField = () => {
    const newSettings = { ...siteSettings };
    newSettings.founder.imageUrls.push('');
    updateSiteSettings(newSettings);
  };

  const removeImageField = (index: number) => {
    const newSettings = { ...siteSettings };
    newSettings.founder.imageUrls.splice(index, 1);
    updateSiteSettings(newSettings);
  };

  const handleSave = () => {
    // The data is saved on change due to updateSiteSettings call.
    // This button just provides user feedback.
    toast({
      title: "Settings Saved",
      description: "Your site content has been updated.",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Site Settings</h1>
        <p className="text-muted-foreground">Manage the content displayed on your public-facing pages.</p>
      </div>

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
              value={siteSettings.brandDescriptions.interiors}
              onChange={(e) => handleBrandDescriptionChange('interiors', e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="decorsDesc">Pavo Decors</Label>
            <Textarea
              id="decorsDesc"
              value={siteSettings.brandDescriptions.decors}
              onChange={(e) => handleBrandDescriptionChange('decors', e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="homesDesc">Pavo Homes</Label>
            <Textarea
              id="homesDesc"
              value={siteSettings.brandDescriptions.homes}
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
                value={siteSettings.founder.mainDescription}
                onChange={(e) => handleFounderInfoChange('mainDescription', e.target.value)}
                rows={4}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="founderPhilosophy">Pavo Philosophy</Label>
                <Textarea
                id="founderPhilosophy"
                value={siteSettings.founder.philosophy}
                onChange={(e) => handleFounderInfoChange('philosophy', e.target.value)}
                rows={3}
                />
            </div>
            <div className="space-y-4">
                <Label>Founder Images</Label>
                {siteSettings.founder.imageUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input 
                            value={url}
                            placeholder="Enter image URL"
                            onChange={(e) => handleImageChange(index, e.target.value)}
                        />
                         <Image src={url || `https://placehold.co/100x100.png`} alt="preview" width={40} height={40} className="rounded-md object-cover"/>
                        <Button variant="ghost" size="icon" onClick={() => removeImageField(index)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={addImageField}>
                    <ImagePlus className="h-4 w-4 mr-2"/>
                    Add Image
                </Button>
            </div>
        </CardContent>
      </Card>


      <div className="flex justify-end">
        <Button onClick={handleSave}>Save All Changes</Button>
      </div>
    </div>
  );
}
