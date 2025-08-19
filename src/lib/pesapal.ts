// src/lib/pesapal.ts
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const PESAPAL_BASE_URL = process.env.PESAPAL_BASE_URL;
const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// Simple in-memory cache for the token and IPN ID
let tokenCache = {
  token: null as string | null,
  expires_at: 0,
};

let ipnIdCache: string | null = null;

const getErrorMessage = (error: any) => {
    if (axios.isAxiosError(error)) {
        const pesapalError = error.response?.data?.error;
        if (pesapalError && pesapalError.message) {
            return pesapalError.message;
        }
        return error.response?.data?.message || error.message;
    }
    return error.message || 'An unknown error occurred';
};


export const getAuthToken = async (): Promise<string> => {
  // Proactively refresh the token if it's within 60 seconds of expiring
  if (tokenCache.token && Date.now() < tokenCache.expires_at - 60000) {
    return tokenCache.token;
  }

  if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET || !PESAPAL_BASE_URL) {
    console.error("Pesapal environment variables are not configured properly.");
    throw new Error("Server configuration error: Pesapal credentials are not set.");
  }

  try {
    console.log("Requesting new Pesapal auth token...");
    const response = await axios.post(
      `${PESAPAL_BASE_URL}/api/Auth/RequestToken`,
      {
        consumer_key: PESAPAL_CONSUMER_KEY,
        consumer_secret: PESAPAL_CONSUMER_SECRET,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    const { token, expiryDate, error } = response.data;
    if (error || !token) {
      console.error("Pesapal Auth Error:", response.data);
      throw new Error(error?.message || "Token not found in Pesapal auth response");
    }

    console.log("Successfully fetched new Pesapal auth token.");
    tokenCache = {
      token,
      expires_at: new Date(expiryDate).getTime(),
    };
    return token;
  } catch (error: any) {
    console.error('Pesapal Auth Request Failed:', getErrorMessage(error));
    throw new Error(getErrorMessage(error));
  }
};

export const getRegisteredIpns = async (token: string): Promise<any[]> => {
    try {
        const response = await axios.get(`${PESAPAL_BASE_URL}/api/URLSetup/GetIpnList`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });
        return response.data;
    } catch (error: any) {
        console.error('Failed to get registered IPNs:', getErrorMessage(error));
        throw new Error(`Failed to get registered IPNs: ${getErrorMessage(error)}`);
    }
};

export const registerIpnUrl = async (): Promise<string> => {
    if (ipnIdCache) {
        console.log("Using cached IPN ID:", ipnIdCache);
        return ipnIdCache;
    }

    const token = await getAuthToken();
    
    if (!APP_URL) {
        throw new Error("NEXT_PUBLIC_APP_URL is not set in .env file");
    }
    const ipnUrl = `${APP_URL}/api/pesapal/ipn`;

    try {
        console.log("Checking for existing IPN registrations...");
        const existingIpns = await getRegisteredIpns(token);
        const existingIpn = existingIpns.find(ipn => ipn.url === ipnUrl);

        if (existingIpn && existingIpn.ipn_id) {
            console.log("Found existing IPN registration:", existingIpn.ipn_id);
            ipnIdCache = existingIpn.ipn_id;
            return ipnIdCache!;
        }

        console.log(`Registering new IPN URL: ${ipnUrl}`);
        const response = await axios.post(
            `${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`,
            { url: ipnUrl, ipn_notification_type: 'GET' },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            }
        );

        if (response.data.error || !response.data.ipn_id) {
            throw new Error(response.data.error?.message || "Failed to retrieve IPN ID from Pesapal.");
        }

        ipnIdCache = response.data.ipn_id;
        console.log("Pesapal IPN Registered successfully:", ipnIdCache);
        return ipnIdCache!;

    } catch (error: any) {
        console.error('Pesapal IPN Registration Failed:', getErrorMessage(error));
        throw new Error(`Pesapal IPN Registration Failed: ${getErrorMessage(error)}`);
    }
};


export const submitOrder = async (orderData: { amount: number, billing_address: any, description: string }) => {
  const token = await getAuthToken();
  const notificationId = await registerIpnUrl();

  const payload = {
    id: uuidv4(),
    currency: 'TZS',
    amount: orderData.amount,
    description: orderData.description,
    callback_url: `${APP_URL}/pesapal/callback`,
    notification_id: notificationId,
    billing_address: {
      ...orderData.billing_address,
      country_code: 'TZ'
    },
  };

  try {
    console.log("Submitting order to Pesapal with payload:", JSON.stringify(payload, null, 2));
    const response = await axios.post(
      `${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    if (response.data.error) {
        console.error("[PESAPAL_API_ERROR] Submit Order:", response.data.error);
        throw new Error(response.data.error.message || 'An error occurred during payment submission.');
    }

    console.log("Pesapal submit order response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error('Pesapal Submit Order Request Failed:', getErrorMessage(error));
    throw new Error(getErrorMessage(error));
  }
};

export const getTransactionStatus = async (orderTrackingId: string) => {
  const token = await getAuthToken();
  try {
    const response = await axios.get(
      `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.error) {
      console.error("Pesapal Get Status API Error:", response.data.error);
      throw new Error(response.data.error.message || 'Unknown error from Pesapal on transaction status check');
    }

    return response.data;
  } catch (error: any)
  {
    console.error('Pesapal Get Transaction Status Request Failed:', getErrorMessage(error));
    throw new Error(getErrorMessage(error));
  }
};
