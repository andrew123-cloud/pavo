
// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import axios from 'axios';

// This is the actual URL of your deployed Cloud Function.
// It's kept here on the server-side, hidden from the client.
const UPLOAD_FUNCTION_URL = 'https://us-central1-pavo-suite.cloudfunctions.net/uploadProduct';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Let Axios set the Content-Type header with the correct boundary
    const response = await axios.post(UPLOAD_FUNCTION_URL, formData, {
      headers: {
        // Axios will set the 'Content-Type' to 'multipart/form-data' automatically
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error("Proxy API Error:", error);
    if (axios.isAxiosError(error) && error.response) {
      // Forward the error response from the Cloud Function
      return NextResponse.json(error.response.data, { status: error.response.status });
    }
    // Handle other errors (e.g., network issues between proxy and function)
    return NextResponse.json({ error: 'An internal server error occurred in the proxy.' }, { status: 500 });
  }
}
