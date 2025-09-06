
// src/app/api/save-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';

// This is your Firebase Function URL. 
// It is now correctly read from your environment variables.
const SAVE_DATA_FUNCTION_URL = process.env.SAVE_DATA_FUNCTION_URL;

export async function POST(request: NextRequest) {
  if (!SAVE_DATA_FUNCTION_URL) {
    console.error('[API_PROXY_ERROR] SAVE_DATA_FUNCTION_URL environment variable is not set.');
    return NextResponse.json({ error: 'Server configuration error: Function URL is missing.' }, { status: 500 });
  }
  
  try {
    const requestFormData = await request.formData();
    const serverFormData = new FormData();

    // Re-create the form data for the server-to-server request
    for (const [key, value] of requestFormData.entries()) {
      if (value instanceof Blob) {
        // Convert Blob to Buffer to append to form-data
        const buffer = Buffer.from(await value.arrayBuffer());
        serverFormData.append(key, buffer, {
            filename: value.name,
            contentType: value.type,
        });
      } else {
        serverFormData.append(key, value);
      }
    }

    console.log(`[API_PROXY] Forwarding request to Firebase Function: ${SAVE_DATA_FUNCTION_URL}`);

    const response = await axios.post(SAVE_DATA_FUNCTION_URL, serverFormData, {
      headers: {
        ...serverFormData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log('[API_PROXY] Received response from Firebase Function.');
    return NextResponse.json(response.data, { status: response.status });

  } catch (error: any) {
    console.error('[API_PROXY_ERROR]', error);
    if (axios.isAxiosError(error) && error.response) {
       console.error('[API_PROXY_ERROR_DETAILS]', error.response.data);
       return NextResponse.json({ error: 'Error from Firebase Function.', details: error.response.data }, { status: error.response.status });
    }
    return NextResponse.json({ error: 'An internal server error occurred in the proxy.', details: error.message }, { status: 500 });
  }
}
