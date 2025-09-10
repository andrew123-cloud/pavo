
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
        // Handle nested JSON objects that were stringified on the client
        try {
            const parsed = JSON.parse(val);
            if (typeof parsed === 'object' && parsed !== null) {
                fields[fieldname] = parsed;
            } else {
                fields[fieldname] = val;
            }
        } catch(e) {
            fields[fieldname] = val;
        }

        if (fieldname === 'collectionName') {
            collectionName = val;
        }
      });

      bb.on('file', (fieldname, file, info) => {
        const { filename, mimeType } = info;
        const sanitizedFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.]/g, '_')}`;
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
              // In Supabase, it's common to organize by table name in the bucket
              const destination = `${collectionName}/${fileName}`;
              
              const { data, error: uploadError } = await supabase.storage
                  .from('pavo-assets') // Assumes a single bucket for all assets
                  .upload(destination, fileContent, {
                      contentType: mimetype,
                      upsert: true,
                  });

              if (uploadError) throw uploadError;
              
              const { data: { publicUrl } } = supabase.storage
                  .from('pavo-assets')
                  .getPublicUrl(destination);
              
              // Map the form field name to the correct Supabase column name
              if (fieldname === 'imageFile') {
                  fields['image_url'] = publicUrl;
              } else {
                  fields[fieldname] = publicUrl; // for beforeImageUrl, etc.
              }
              fs.unlinkSync(filePath);
          }
          
          // Remove collectionName as it's not a field in the tables
          const { collectionName: _, ...dataToSave } = fields;

          // Convert numeric types for all relevant tables
          if(dataToSave.price) dataToSave.price = Number(dataToSave.price);
          if(dataToSave.stock) dataToSave.stock = Number(dataToSave.stock);
          if(dataToSave.pricePerNight) dataToSave.pricePerNight = Number(dataToSave.pricePerNight);
          if(dataToSave.rating) dataToSave.rating = Number(dataToSave.rating);
          
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

    