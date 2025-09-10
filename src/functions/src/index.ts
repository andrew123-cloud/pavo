
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
    if (!isNaN(Number(value)) && !/^\s*$/.test(value) && !/^0\d/.test(value)) return Number(value);
    try {
        const parsed = JSON.parse(value);
        // Recursively parse values within the parsed object
        if (typeof parsed === 'object' && parsed !== null) {
            for (const key in parsed) {
                if (Object.prototype.hasOwnProperty.call(parsed, key)) {
                    parsed[key] = parseValue(parsed[key]);
                }
            }
        }
        return parsed;
    } catch (e) {
        return value; // It's just a string
    }
};


export const saveData = functions
  .runWith({ memory: '512MB', secrets: ["SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_URL"] })
  .https.onRequest((req, res) => {
    // Initialize Supabase Admin Client inside the function
    // to access secrets properly.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    corsHandler(req, res, () => {
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

      bb.on('field', (fieldname, val) => {
        // We will parse all values in the finish step to ensure consistency
        fields[fieldname] = val;
        if (fieldname === 'collectionName') {
            collectionName = val;
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
          
          // Parse all field values from strings to their correct types
          for(const key in fields) {
              if (Object.prototype.hasOwnProperty.call(fields, key)) {
                  fields[key] = parseValue(fields[key]);
              }
          }

          for (const fieldname in filesToUpload) {
              const { filePath, mimetype, fileName } = filesToUpload[fieldname];
              const fileContent = fs.readFileSync(filePath);
              // In Supabase, it's common to organize by table name in the bucket
              const destination = `${collectionName}/${fileName}`;
              
              const { error: uploadError } = await supabase.storage
                  .from('pavo-assets') // Assumes a single bucket for all assets
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
                 // For hero images and founder images in site settings
                 // The fieldname will be like 'heroImages.interiors.0' or 'founder.imageUrls.0'
                 const parts = fieldname.split('.');
                 let current = fields;
                 for(let i=0; i < parts.length -1; i++){
                    current = current[parts[i]];
                 }
                 current[parts[parts.length -1]] = publicUrl;
              }
              fs.unlinkSync(filePath);
          }
          
          const { collectionName: _, ...dataToSave } = fields;

          // The parseValue helper handles type conversion now, so manual checks are less needed
          // but we can keep them as a safeguard if necessary.
          
          // Supabase upsert
          const { data: dbData, error: dbError } = await supabase
            .from(collectionName)
            .upsert(dataToSave, { onConflict: 'id' })
            .select();

          if (dbError) throw dbError;

          res.status(200).json({ message: 'Data saved successfully!', ...(dbData ? dbData[0] : {}) });

        } catch (error: any) {
          console.error(`Supabase backend error in table ${collectionName}:`, error);
          res.status(500).json({ error: error.message || 'An internal server error occurred.' });
        }
      });

      req.pipe(bb);
    });
  });
