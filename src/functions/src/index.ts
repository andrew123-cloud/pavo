
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';

admin.initializeApp();
const corsHandler = cors({ origin: true });

export const saveMetadata = functions
  .runWith({ memory: '512MB' })
  .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      try {
        const { collection, id, ...data } = req.body;

        if (!collection) {
          res.status(400).json({ error: 'Collection name is required.' });
          return;
        }

        const firestore = admin.firestore();
        if (id) {
          // Update existing document
          const docRef = firestore.collection(collection).doc(id);
          await docRef.set(data, { merge: true });
          res.status(200).json({ message: 'Item updated successfully!', id, ...data });
        } else {
          // Create new document
          const docRef = await firestore.collection(collection).add(data);
          res.status(201).json({ message: 'Item added successfully!', id: docRef.id, ...data });
        }
      } catch (error: any) {
        console.error('Backend error:', error);
        res.status(500).json({ error: error.message || 'An internal server error occurred.' });
      }
    });
  });


    