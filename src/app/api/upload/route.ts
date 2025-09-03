
// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';

const UPLOAD_FUNCTION_URL = process.env.UPLOAD_FUNCTION_URL;

export async function POST(request: NextRequest) {
  if (!UPLOAD_FUNCTION_URL) {
    console.error("UPLOAD_FUNCTION_URL environment variable is not set.");
    return NextResponse.json({ error: 'Server configuration error: Function URL is missing.' }, { status: 500 });
  }

  try {
    const incomingFormData = await request.formData();
    const formData = new FormData();

    // The `form-data` library requires the file stream to be handled correctly.
    // We can iterate through the entries and append them.
    for (const [key, value] of incomingFormData.entries()) {
      if (value instanceof Blob) {
        // Convert Blob to Buffer to be sent correctly by Axios in Node.js
        const buffer = Buffer.from(await value.arrayBuffer());
        formData.append(key, buffer, value.name);
      } else {
        formData.append(key, value);
      }
    }
    
    console.log(`Forwarding request to: ${UPLOAD_FUNCTION_URL}`);

    const response = await axios.post(UPLOAD_FUNCTION_URL, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return NextResponse.json(response.data, { status: response.status });

  } catch (error: any) {
    console.error("Proxy API Error:", error?.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }
    return NextResponse.json({ error: 'An internal server error occurred in the proxy.' }, { status: 500 });
  }
}

    