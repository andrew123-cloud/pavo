// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';

// This is the actual URL of your deployed Cloud Function.
// It's kept here on the server-side, hidden from the client.
const UPLOAD_FUNCTION_URL = process.env.UPLOAD_FUNCTION_URL;

export async function POST(request: NextRequest) {
  if (!UPLOAD_FUNCTION_URL) {
    console.error("UPLOAD_FUNCTION_URL environment variable is not set.");
    return NextResponse.json({ error: 'Server configuration error: Upload URL not configured.' }, { status: 500 });
  }

  try {
    const incomingFormData = await request.formData();
    const formData = new FormData();

    // Reconstruct the FormData for the Node.js environment
    for (const [key, value] of incomingFormData.entries()) {
      // The `value` can be a string or a File object.
      // The `form-data` library can handle both.
      formData.append(key, value);
    }
    
    // Let Axios set the Content-Type header with the correct boundary
    const response = await axios.post(UPLOAD_FUNCTION_URL, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error("Proxy API Error:", error);
    if (axios.isAxiosError(error) && error.response) {
      // Forward the error response from the Cloud Function
      return NextResponse.json(error.response.data || { error: 'An error occurred in the upload function.' }, { status: error.response.status });
    }
    // Handle other errors (e.g., network issues between proxy and function)
    return NextResponse.json({ error: 'An internal server error occurred in the proxy.' }, { status: 500 });
  }
}
