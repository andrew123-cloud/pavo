
// src/app/api/saveData/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import busboy from 'busboy';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Helper to parse string values that might be stringified JSON
const parseValue = (value: any): any => {
    if (typeof value !== 'string') return value;
    try {
        // Only parse if it looks like an object or array
        if (value.startsWith('{') || value.startsWith('[')) {
            return JSON.parse(value);
        }
    } catch (e) {
        // If it fails, it's just a regular string
    }
    return value;
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
    const bucketName = 'pavo-assets';

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
            if (!filename) {
                file.resume(); // Discard the file if it has no name
                return;
            }
            const fileExt = path.extname(filename);
            const urlSafeFilename = `${uuidv4()}${fileExt}`;

            try {
                const fileContent = await streamToBuffer(file);
                filesToUpload[fieldname] = { fileContent, mimetype: mimeType, fileName: urlSafeFilename };
                 console.log(`[SAVE_API] Buffered file: ${fieldname} (${filename})`);
            } catch (error) {
                console.error('[SAVE_API] Error buffering file:', error);
                file.resume(); // Ensure stream is consumed
                reject(error);
            }
        });
        
        bb.on('finish', resolve);
        bb.on('error', (err) => {
            console.error('[SAVE_API] Busboy parsing error:', err);
            reject(err);
        });
    });

    try {
        const bodyBuffer = Buffer.from(await req.arrayBuffer());
        bb.end(bodyBuffer);
        await parsingDone;
    } catch (error) {
        return NextResponse.json({ error: 'Failed to parse form data.' }, { status: 400 });
    }
   
    if (!collectionName) {
        return NextResponse.json({ error: 'Collection name (table name) is required.' }, { status: 400 });
    }

    try {
        // Sequentially upload files and get their URLs
        for (const fieldname in filesToUpload) {
            const { fileContent, mimetype, fileName } = filesToUpload[fieldname];
            const destination = `${collectionName}/${fileName}`;
            
            console.log(`[SAVE_API] Uploading: ${fieldname} to ${destination} in bucket: ${bucketName}`);

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(destination, fileContent, {
                    contentType: mimetype,
                    upsert: true,
                });

            if (uploadError) {
                console.error("[SAVE_API] Supabase Storage Upload Error:", uploadError);
                // Check for common errors like "Bucket not found"
                if (uploadError.message.includes("Bucket not found")) {
                     throw new Error(`Supabase error: Bucket "${bucketName}" not found. Please ensure it exists and has the correct public access policies.`);
                }
                throw uploadError;
            }
            
            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(destination);
            
            console.log(`[SAVE_API] Upload successful. Public URL: ${publicUrl}`);
            
            // Assign URL to the correct field based on the input field name
            if (fieldname === 'imageFile') {
                 if (collectionName === 'products') {
                    fields['image_url'] = publicUrl;
                } else {
                    fields['imageUrl'] = publicUrl;
                }
            } else if (fieldname === 'beforeImageFile') {
                fields['beforeImageUrl'] = publicUrl;
            } else {
                 // Handle nested hero/founder images
                const parts = fieldname.split('.');
                let current = fields;
                for(let i=0; i < parts.length -1; i++){
                    const part = parts[i];
                    const nextPartIsNumber = /^\d+$/.test(parts[i+1]);
                     if (current[part] === undefined || typeof current[part] !== 'object') {
                        current[part] = nextPartIsNumber ? [] : {};
                    }
                    current = current[part];
                }
                current[parts[parts.length -1]] = publicUrl;
            }
        }
        
        const finalData = { ...fields };
        if (finalData.id) {
            finalData.id = Number(finalData.id);
        }
        
        console.log(`[SAVE_API] Upserting data into "${collectionName}":`, JSON.stringify(finalData, null, 2));

        const { data: dbData, error: dbError } = await supabase
            .from(collectionName)
            .upsert(finalData, { onConflict: 'id' })
            .select()
            .single();

        if (dbError) {
            console.error("[SAVE_API] Supabase DB Error:", dbError);
            throw dbError;
        }

        console.log(`[SAVE_API] DB operation successful for ID: ${dbData.id}`);
        return NextResponse.json(dbData, { status: 200 });

    } catch (error: any) {
        console.error(`[SAVE_API] Final error for collection ${collectionName}:`, error);
        return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
    }
}

    