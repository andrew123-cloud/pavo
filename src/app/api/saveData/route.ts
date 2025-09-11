// src/app/api/saveData/route.ts
import { supabase } from '@/lib/supabase'; // Use the singleton instance
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';

async function streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

// Helper to recursively parse string values to their likely types
const parseValue = (value: any): any => {
    if (typeof value !== 'string') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    // Check if it's a number but avoid parsing strings with leading zeros as octal, and ignore empty strings.
    if (!isNaN(Number(value)) && !/^\s*$/.test(value) && !/^0\d/.test(value)) return Number(value);
    
    // Try parsing as JSON, but return original string on failure
    try {
        const parsed = JSON.parse(value);
        // If it's an object, we recursively parse its properties.
        if (typeof parsed === 'object' && parsed !== null) {
            // Handle arrays
            if(Array.isArray(parsed)){
                return parsed.map(item => parseValue(item));
            }
            // Handle objects
            for (const key in parsed) {
                if (Object.prototype.hasOwnProperty.call(parsed, key)) {
                    parsed[key] = parseValue(parsed[key]);
                }
            }
        }
        return parsed;
    } catch (e) {
        return value; // It's just a string, return as is.
    }
};

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const collectionName = formData.get('collectionName') as string;

        if (!collectionName) {
            return NextResponse.json({ error: 'Collection name (table name) is required.' }, { status: 400 });
        }

        const fields: { [key: string]: any } = {};
        const fileUploads: { [key: string]: { file: File, path: string } } = {};

        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                const sanitizedFilename = `${Date.now()}-${value.name.replace(/[^a-zA-Z0-9.-_]/g, '_')}`;
                fileUploads[key] = {
                    file: value,
                    path: `${collectionName}/${sanitizedFilename}`,
                };
            } else if (key !== 'collectionName') {
                fields[key] = parseValue(value);
            }
        }

        // Specific handling for siteSettings table with string 'id'
        if (collectionName === 'siteSettings') {
            fields['id'] = 'default';
        }

        // Upload files to Supabase Storage
        for (const fieldname in fileUploads) {
            const { file, path } = fileUploads[fieldname];
            const { error: uploadError } = await supabase.storage
                .from('pavo-assets')
                .upload(path, file, {
                    contentType: file.type,
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('pavo-assets')
                .getPublicUrl(path);

            if (fieldname === 'imageFile') {
                fields['image_url'] = publicUrl;
            } else if (fieldname === 'beforeImageFile') {
                fields['beforeImageUrl'] = publicUrl;
            } else {
                 const parts = fieldname.split('.');
                 let current = fields;
                 for(let i=0; i < parts.length -1; i++){
                     if (current[parts[i]] === undefined) {
                         current[parts[i]] = /^\d+$/.test(parts[i+1]) ? [] : {};
                     }
                     current = current[parts[i]];
                 }
                 current[parts[parts.length -1]] = publicUrl;
            }
        }
        
        // Save metadata to Supabase database
        const { data: dbData, error: dbError } = await supabase
            .from(collectionName)
            .upsert(fields, { onConflict: 'id' })
            .select();

        if (dbError) throw dbError;

        return NextResponse.json({ message: 'Data saved successfully!', ...(dbData ? dbData[0] : {}) }, { status: 200 });

    } catch (error: any) {
        console.error(`[API SaveData] Error:`, error);
        return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
    }
}
