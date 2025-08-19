// src/app/api/pesapal/auth/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

// This is a dedicated route for testing authentication with Pesapal.
// Call this route directly (e.g., via a test button or Postman) to debug connection issues.
export async function POST() {
  const authUrl = `${process.env.PESAPAL_BASE_URL}/api/Auth/RequestToken`;
  console.log(`[PESAPAL_AUTH_TEST] Attempting to get token from: ${authUrl}`);

  if (!process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET) {
      const errorMessage = "Pesapal consumer key or secret is not set in .env file.";
      console.error(`[PESAPAL_AUTH_TEST] ❌ CONFIGURATION ERROR: ${errorMessage}`);
      return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' }});
  }

  try {
    const response = await axios.post(
      authUrl,
      {
        consumer_key: process.env.PESAPAL_CONSUMER_KEY,
        consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    console.log('✅ [PESAPAL_AUTH_TEST] SUCCESS! Full Pesapal Auth Response Body:', response.data);
    return NextResponse.json(response.data);

  } catch (error: any) {
    if (axios.isAxiosError(error)) {
        console.error('❌ [PESAPAL_AUTH_TEST] AXIOS ERROR! Full Pesapal Auth Error Response:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            headers: error.response?.headers,
            data: error.response?.data,
            message: error.message,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers,
                // Do not log the body here as it contains secrets
            }
        });
        return new Response(
            JSON.stringify({
                error: "Failed to authenticate with Pesapal.",
                details: error.response?.data || error.message
            }),
            { status: error.response?.status || 500, headers: { 'Content-Type': 'application/json' }}
        );
    }
    
    console.error('❌ [PESAPAL_AUTH_TEST] UNKNOWN ERROR!', error);
    return new Response(
        JSON.stringify({ error: "An unknown error occurred during Pesapal authentication." }),
        { status: 500, headers: { 'Content-Type': 'application/json' }}
    );
  }
}
