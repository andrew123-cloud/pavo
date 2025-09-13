// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export async function POST(req: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const bucketName = 'pavo-assets';

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Supabase credentials are not configured.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const collectionName = formData.get('collectionName') as string;

    if (!file) {
        return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
     if (!collectionName) {
        return NextResponse.json({ error: 'No collectionName provided.' }, { status: 400 });
    }

    const fileExt = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExt}`;
    const destination = `${collectionName}/${fileName}`;
    
    try {
        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(destination, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
             console.error("[UPLOAD_API] Supabase Storage Upload Error:", uploadError);
             throw new Error(uploadError.message);
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(destination);
            
        return NextResponse.json({ publicUrl });

    } catch (error: any) {
        console.error('[UPLOAD_API] Final error:', error);
        return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
    }
}
