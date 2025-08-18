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


export const getAuthToken = async () => {
  // Proactively refresh the token if it's within 30 seconds of expiring
  if (tokenCache.token && Date.now() < tokenCache.expires_at - 30000) {
    return tokenCache.token;
  }

  if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET || !PESAPAL_BASE_URL) {
      console.error("Pesapal environment variables are not set.");
      throw new Error("Pesapal environment variables are not configured properly.");
  }
  
  try {
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

    const { token, expiryDate } = response.data;
    tokenCache = {
      token,
      expires_at: new Date(expiryDate).getTime(),
    };
    return token;
  } catch (error: any) {
    console.error('Pesapal Auth Error:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Pesapal');
  }
};

export const registerIpnUrl = async (): Promise<string> => {
   if (ipnIdCache) {
    return ipnIdCache;
  }
  
  const token = await getAuthToken();
  
  if (!APP_URL) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set in .env file");
  }

  const ipnUrl = `${APP_URL}/api/pesapal/ipn`;

  try {
    const response = await axios.post(
      `${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`,
      {
        url: ipnUrl,
        ipn_notification_type: 'GET',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    if (!response.data || !response.data.ipn_id) {
        console.error("IPN ID not found in Pesapal's response", response.data);
        throw new Error("Failed to retrieve IPN ID from Pesapal.");
    }
    
    ipnIdCache = response.data.ipn_id;
    console.log("Pesapal IPN Registered successfully:", response.data);
    return response.data.ipn_id;
  } catch (error: any) {
    console.error('Pesapal IPN Registration Error:', error.response?.data || error.message);
    throw new Error('Failed to register IPN URL with Pesapal');
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
      country_code: 'TZ' // Pesapal requires a country code
    },
  };

  try {
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
    return response.data;
  } catch (error: any) {
    console.error('Pesapal Submit Order Error:', error.response?.data || error.message);
    if (error.response) {
      console.error("Error data:", error.response.data);
      throw new Error(error.response.data?.error?.message || 'Failed to submit order to Pesapal');
    }
    throw new Error('Failed to submit order to Pesapal');
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
    return response.data;
  } catch (error: any) {
    console.error('Pesapal Get Transaction Status Error:', error.response?.data || error.message);
    throw new Error('Failed to get transaction status from Pesapal');
  }
};
