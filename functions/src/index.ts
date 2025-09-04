// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as busboy from 'busboy';
import { v4 as uuidv4 } from 'uuid';

admin.initializeApp();

export const uploadProduct = functions
  .runWith({ memory: '512MB' })
  .https.onRequest((req, res) => {
    // This function is called from a trusted server (Next.js proxy),
    // so a CORS handler is not required here.

    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const bb = busboy({ headers: req.headers });
    const fields: { [key: string]: string } = {};
    let upload: {
      file?: NodeJS.ReadableStream;
      filename?: string;
      mimetype?: string;
    } = {};

    const firestore = admin.firestore();
    const bucket = admin.storage().bucket();

    // Process all text fields in the form
    bb.on('field', (fieldname, val) => {
      console.log(`[Busboy] Field [${fieldname}]: value: ${val}`);
      fields[fieldname] = val;
    });

    // Process the file upload
    bb.on('file', (fieldname, file, info) => {
      console.log(`[Busboy] File [${fieldname}]: filename: ${info.filename}, encoding: ${info.encoding}, mimeType: ${info.mimeType}`);
      const { filename, mimeType } = info;
      upload = { file, filename, mimetype: mimeType };
    });

    // This event fires when busboy has finished parsing the request
    bb.on('finish', async () => {
      console.log('[Busboy] Finished parsing form.');
      try {
        if (!fields.collection) {
          console.error('Validation Error: Collection name is required.');
          res.status(400).json({ error: 'Form submission error: The "collection" field is required.' });
          return;
        }

        const docData: { [key: string]: any } = {};
        for (const key in fields) {
            // Exclude fields that are not part of the Firestore document
            if (key !== 'collection' && key !== 'id') {
                // Convert numeric strings to numbers for Firestore
                const isNumeric = !isNaN(parseFloat(fields[key])) && isFinite(Number(fields[key]));
                docData[key] = isNumeric ? Number(fields[key]) : fields[key];
            }
        }
        
        // Handle file upload to Firebase Storage if a file was provided
        if (upload.file && upload.filename) {
          console.log(`Uploading file: ${upload.filename} to Storage.`);
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
              ?.pipe(stream)
              .on('error', (err) => {
                console.error('Storage file stream error:', err);
                reject(new Error('Failed to upload image.'));
              })
              .on('finish', () => {
                 console.log('File upload to Storage finished.');
                 resolve();
              });
          });
          
          // Set the public URL for the uploaded file
          docData.imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${fileUuid}`;
          console.log(`File uploaded. Public URL: ${docData.imageUrl}`);

        } else if (fields.imageUrl) {
          // If no new file is uploaded but an imageUrl is provided (for edits), use it.
          docData.imageUrl = fields.imageUrl;
        }

        // Save the document to Firestore
        if (fields.id) {
          // Update an existing document
          console.log(`Updating document ${fields.id} in collection ${fields.collection}.`);
          const docRef = firestore.collection(fields.collection).doc(fields.id);
          await docRef.set(docData, { merge: true });
          res.status(200).json({ message: 'Item updated successfully!', id: fields.id, ...docData });
        } else {
          // Create a new document
          console.log(`Creating new document in collection ${fields.collection}.`);
          const docRef = await firestore.collection(fields.collection).add(docData);
          res.status(201).json({ message: 'Item added successfully!', id: docRef.id, ...docData });
        }
      } catch (error: any) {
        console.error('Backend execution error:', error);
        res.status(500).json({ error: error.message || 'An internal server error occurred while processing your request.' });
      }
    });

    // In Firebase Functions, the raw body is available on `req.rawBody`.
    // We must end the busboy stream with this raw body.
    if (req.rawBody) {
        bb.end(req.rawBody);
    } else {
        // Fallback for local testing or different environments
        req.pipe(bb);
    }
  });