
// src/app/api/saveData/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import busboy from 'busboy';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Helper to parse string values to their likely types
const parseValue = (value: any): any => {
    if (typeof value !== 'string') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(Number(value)) && !/^\s*$/.test(value) && !/^0\d/.test(value)) return Number(value);
    
    try {
        const parsed = JSON.parse(value);
        return parsed;
    } catch (e) {
        return value;
    }
};

async function streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

export async function POST(req: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Supabase credentials are not configured.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    });

    const headers = req.headers;
    const bb = busboy({ headers: Object.fromEntries(headers.entries()) });

    const fields: { [key: string]: any } = {};
    const filesToUpload: { [fieldname: string]: { fileContent: Buffer; mimetype: string, fileName: string } } = {};
    
    let collectionName = '';

    const parsingDone = new Promise<void>((resolve, reject) => {
        bb.on('field', (fieldname: string, val: string) => {
            if (fieldname === "collectionName") {
                collectionName = val;
            } else {
                 fields[fieldname] = parseValue(val);
            }
        });

        bb.on('file', async (fieldname: string, file: Readable, info: busboy.FileInfo) => {
            const { filename, mimeType } = info;
            // Generate a unique, URL-safe filename
            const fileExt = path.extname(filename);
            const urlSafeFilename = `${uuidv4()}${fileExt}`;

            try {
                const fileContent = await streamToBuffer(file);
                filesToUpload[fieldname] = { fileContent, mimetype: mimeType, fileName: urlSafeFilename };
            } catch (error) {
                reject(error);
            }
        });
        
        bb.on('finish', resolve);
        bb.on('error', reject);
    });

    try {
        const bodyBuffer = Buffer.from(await req.arrayBuffer());
        bb.end(bodyBuffer);
        await parsingDone;
    } catch (error) {
        console.error('Busboy parsing error:', error);
        return NextResponse.json({ error: 'Failed to parse form data.' }, { status: 400 });
    }
   
    if (!collectionName) {
        return NextResponse.json({ error: 'Collection name (table name) is required.' }, { status: 400 });
    }

    try {
        for (const fieldname in filesToUpload) {
            const { fileContent, mimetype, fileName } = filesToUpload[fieldname];
            const destination = `${collectionName}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
                .from('pavo-assets')
                .upload(destination, fileContent, {
                    contentType: mimetype,
                    upsert: true,
                });

            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage
                .from('pavo-assets')
                .getPublicUrl(destination);
            
            // This is the corrected logic block
            if (fieldname === 'imageFile') {
                 if (collectionName === 'products') {
                    fields['image_url'] = publicUrl;
                } else {
                    fields['imageUrl'] = publicUrl;
                }
            } else if (fieldname === 'beforeImageFile') {
                fields['beforeImageUrl'] = publicUrl;
            } else {
                // This handles nested paths for siteSettings
                const parts = fieldname.split('.');
                let current = fields;
                for(let i=0; i < parts.length -1; i++){
                    const part = parts[i];
                    const nextPartIsNumber = /^\d+$/.test(parts[i+1]);
                    if (current[part] === undefined) {
                        current[part] = nextPartIsNumber ? [] : {};
                    }
                    current = current[part];
                }
                current[parts[parts.length -1]] = publicUrl;
            }
        }
        
        // This block is no longer needed due to the change above
        // if (collectionName === 'products' && fields.imageUrl) {
        //     fields.image_url = fields.imageUrl;
        //     delete fields.imageUrl; // remove the incorrect field name
        // }


        const { data: dbData, error: dbError } = await supabase
            .from(collectionName)
            .upsert(fields, { onConflict: 'id' })
            .select()
            .single();

        if (dbError) throw dbError;

        return NextResponse.json(dbData, { status: 200 });

    } catch (error: any) {
        console.error(`Supabase backend error in table ${collectionName}:`, error);
        return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
    }
}
