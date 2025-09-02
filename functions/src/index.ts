
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
import * as busboy from 'busboy';
import { v4 as uuidv4 } from 'uuid';

admin.initializeApp();

const corsHandler = cors({ origin: true });

export const uploadProduct = functions
  .runWith({ memory: '512MB' })
  .https.onRequest((req, res) => {
    // By wrapping the function in corsHandler, we enable it to handle
    // pre-flight (OPTIONS) requests and sets the correct headers on the actual request.
    corsHandler(req, res, () => {
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const bb = busboy({ headers: req.headers });
      const fields: { [key: string]: string } = {};
      let upload: {
        file?: NodeJS.ReadableStream;
        filename?: string;
        mimetype?: string;
      } = {};

      const firestore = admin.firestore();
      const storage = admin.storage();
      const bucketName = 'pavo-suite.appspot.com';
      const bucket = storage.bucket(bucketName);

      bb.on('field', (fieldname, val) => {
        fields[fieldname] = val;
      });

      bb.on('file', (fieldname, file, info) => {
        const { filename, mimeType } = info;
        upload = { file, filename, mimetype: mimeType };
      });

      bb.on('finish', async () => {
        if (!fields.collection) {
          res.status(400).json({ error: 'Collection name is required.' });
          return;
        }

        const docData: { [key: string]: any } = {};
        for (const key in fields) {
            if (key !== 'collection' && key !== 'id') {
                const isNumeric = !isNaN(parseFloat(fields[key])) && isFinite(Number(fields[key]));
                docData[key] = isNumeric ? Number(fields[key]) : fields[key];
            }
        }
        
        try {
          if (upload.file && upload.filename) {
            const fileUuid = uuidv4();
            const filePath = `${fields.collection}/${Date.now()}-${upload.filename}`;
            const file = bucket.file(filePath);
            const stream = file.createWriteStream({
              metadata: {
                contentType: upload.mimetype,
                metadata: {
                  firebaseStorageDownloadTokens: fileUuid,
                },
              },
              resumable: false,
            });

            await new Promise<void>((resolve, reject) => {
              upload.file
                .pipe(stream)
                .on('error', (err) => {
                  console.error('File stream error:', err);
                  reject(new Error('Failed to upload image.'));
                })
                .on('finish', () => {
                   resolve();
                });
            });
            
            docData.imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${fileUuid}`;

          } else if (fields.imageUrl) {
            docData.imageUrl = fields.imageUrl;
          }

          if (fields.id) {
            // Update existing document
            const docRef = firestore.collection(fields.collection).doc(fields.id);
            await docRef.set(docData, { merge: true });
            res.status(200).json({ message: 'Item updated successfully!', id: fields.id, ...docData });
          } else {
            // Create new document
            const docRef = await firestore.collection(fields.collection).add(docData);
            res.status(201).json({ message: 'Item added successfully!', id: docRef.id, ...docData });
          }
        } catch (error: any) {
          console.error('Backend error:', error);
          res.status(500).json({ error: error.message || 'An internal server error occurred.' });
        }
      });

      bb.end(req.rawBody);
    });
  });
