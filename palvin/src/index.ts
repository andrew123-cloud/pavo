// palvin/src/index.ts
import {https} from "firebase-functions/v2";
import * as admin from "firebase-admin";
import cors from "cors";
import busboy from "busboy";
import * as dpath from "path";
import * as os from "os";
import * as fs from "fs";

admin.initializeApp();
const corsHandler = cors({ origin: true });

const rtdb = admin.database();
const storage = admin.storage().bucket();

export const saveData = https.onRequest({ memory: "512MiB", invoker: "public" }, (req, res) => {
    corsHandler(req, res, () => {
        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }

        const bb = busboy({ headers: req.headers });
        const tmpdir = os.tmpdir();

        const fields: { [key: string]: any } = {};
        const fileWrites: Promise<any>[] = [];
        const filesToUpload: { [fieldname: string]: { filePath: string; mimetype: string } } = {};
        
        let collectionName = "";
        let docId = "";

        bb.on("field", (fieldname: string, val: any) => {
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
            const filepath = dpath.join(tmpdir, filename);
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
                // For RTDB, we can use push() to generate a unique key.
                docId = rtdb.ref(collectionName).push().key!;
            }

            try {
                await Promise.all(fileWrites);

                for (const fieldname in filesToUpload) {
                    if (Object.prototype.hasOwnProperty.call(filesToUpload, fieldname)) {
                        const { filePath, mimetype } = filesToUpload[fieldname];
                        const destination = `${collectionName}/${docId}/${dpath.basename(filePath)}`;
                        
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
                
                const dbPath = `${collectionName}/${docId}`;
                console.log(`Attempting to write to RTDB path: ${dbPath}`, fields);

                const dataToSave = { ...fields, id: docId };
                await rtdb.ref(dbPath).set(dataToSave);

                res.status(200).json({ message: "Data saved successfully!", ...dataToSave });

            } catch (error: any) {
                console.error(`Error during RTDB operation or file upload for path "${collectionName}/${docId}":`, error);
                res.status(500).json({ error: error.message || "An internal server error occurred." });
            }
        });

        (req as any).pipe(bb);
    });
});
