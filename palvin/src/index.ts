// palvin/src/index.ts
import { https } from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";
import busboy from "busboy";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

admin.initializeApp();
const corsHandler = cors({ origin: true });

const db = admin.firestore();
const storage = admin.storage().bucket();

export const saveData = https.onRequest((req, res) => {
    corsHandler(req, res, () => {
        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }

        const bb = busboy({ headers: req.headers });
        const tmpdir = os.tmpdir();

        const fields: { [key: string]: string } = {};
        const fileWrites: Promise<any>[] = [];
        const filesToUpload: { [fieldname: string]: { filePath: string; mimetype: string } } = {};
        
        let collectionName = "";
        let docId = "";

        bb.on("field", (fieldname: string, val: string) => {
            console.log(`Processed field ${fieldname}: ${val}.`);
            if (fieldname === "collectionName") {
                collectionName = val;
            } else if (fieldname === "id") {
                docId = val;
            } else {
                fields[fieldname] = val;
            }
        });

        bb.on("file", (fieldname: string, file: NodeJS.ReadableStream, info: busboy.FileInfo) => {
            console.log(`Processed file ${info.filename} for field ${fieldname}`);
            const { filename, mimeType } = info;
            const filepath = path.join(tmpdir, filename);
            const writeStream = fs.createWriteStream(filepath);
            file.pipe(writeStream);

            const promise = new Promise((resolve, reject) => {
                file.on("end", () => writeStream.end());
                writeStream.on("finish", () => {
                    filesToUpload[fieldname] = { filePath: filepath, mimetype: mimeType };
                    resolve(filepath);
                });
                writeStream.on("error", reject);
            });
            fileWrites.push(promise);
        });

        bb.on("finish", async () => {
            if (!collectionName) {
                res.status(400).json({ error: "Collection name is required." });
                return;
            }
            if (!docId) {
                docId = db.collection(collectionName).doc().id;
            }

            try {
                await Promise.all(fileWrites);

                for (const fieldname in filesToUpload) {
                    if (Object.prototype.hasOwnProperty.call(filesToUpload, fieldname)) {
                        const { filePath, mimetype } = filesToUpload[fieldname];
                        const destination = `${collectionName}/${docId}/${path.basename(filePath)}`;
                        
                        const [uploadedFile] = await storage.upload(filePath, {
                            destination: destination,
                            metadata: { contentType: mimetype },
                        });

                        fs.unlinkSync(filePath); // Clean up the temp file
                        
                        const downloadURL = await uploadedFile.getSignedUrl({
                            action: "read",
                            expires: "03-09-2491"
                        });
                        
                        fields[fieldname] = downloadURL[0];
                    }
                }
                
                const docRef = db.collection(collectionName).doc(docId);
                await docRef.set(fields, { merge: true });

                res.status(200).json({ message: "Data saved successfully!", id: docId, ...fields });

            } catch (error: any) {
                console.error("Backend error:", error);
                res.status(500).json({ error: error.message || "An internal server error occurred." });
            }
        });

        bb.end(req.rawBody);
    });
});
