
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
import * as busboy from 'busboy';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

admin.initializeApp();
const corsHandler = cors({ origin: true });

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
        // This is a simple check. A more robust implementation might be needed
        // if you expect deep object structures.
        return parsed;
    } catch (e) {
        return value; // It's just a string, return as is.
    }
};


export const saveData = functions
  .runWith({ memory: '512MB', secrets: ["SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_URL"] })
  .https.onRequest((req, res) => {
    corsHandler(req, res, () => {
        // Initialization needs to happen inside the request to access secrets
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        // Create a single client instance per request that bypasses RLS
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false
            }
        });

        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        const bb = busboy({ headers: req.headers });
        const tmpdir = os.tmpdir();

        const fields: { [key: string]: any } = {};
        const fileWrites: Promise<any>[] = [];
        const filesToUpload: { [fieldname: string]: { filePath: string; mimetype: string, fileName: string } } = {};
        
        let collectionName = '';
        let docId = '';

        bb.on('field', (fieldname, val) => {
            if (fieldname === 'collectionName') {
                collectionName = val;
            } else if (fieldname === 'id') {
                docId = val;
                fields[fieldname] = parseValue(val);
            }
            else {
                fields[fieldname] = parseValue(val);
            }
        });

        bb.on('file', (fieldname, file, info) => {
            const { filename, mimeType } = info;
            const sanitizedFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-_]/g, '_')}`;
            const filepath = path.join(tmpdir, sanitizedFilename);
            const writeStream = fs.createWriteStream(filepath);
            file.pipe(writeStream);

            const promise = new Promise((resolve, reject) => {
                file.on('end', () => writeStream.end());
                writeStream.on('finish', () => {
                    filesToUpload[fieldname] = { filePath: filepath, mimetype: mimeType, fileName: sanitizedFilename };
                    resolve(filepath);
                });
                writeStream.on('error', reject);
            });
            fileWrites.push(promise);
        });

        bb.on('finish', async () => {
            if (!collectionName) {
                res.status(400).json({ error: 'Collection name (table name) is required.' });
                return;
            }
            
            try {
                await Promise.all(fileWrites);
                
                for (const fieldname in filesToUpload) {
                    const { filePath, mimetype, fileName } = filesToUpload[fieldname];
                    const fileContent = fs.readFileSync(filePath);
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
                    fs.unlinkSync(filePath);
                }
                
                const { data: dbData, error: dbError } = await supabase
                    .from(collectionName)
                    .upsert(fields, { onConflict: 'id' })
                    .select()
                    .single();

                if (dbError) throw dbError;

                res.status(200).json(dbData);

            } catch (error: any) {
                console.error(`Supabase backend error in table ${collectionName}:`, error);
                res.status(500).json({ error: error.message || 'An internal server error occurred.' });
            }
        });

        bb.end(req.rawBody);
    });
  });
