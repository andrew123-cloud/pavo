// src/lib/pesapal.ts
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const PESAPAL_BASE_URL = process.env.PESAPAL_BASE_URL;
const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

// Simple in-memory cache for the token
let tokenCache = {
  token: null as string | null,
  expires_at: 0,
};

// In-memory store for IPN ID
let ipnId: string | null = null;

export const getAuthToken = async () => {
  if (tokenCache.token && Date.now() < tokenCache.expires_at) {
    return tokenCache.token;
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

export const registerIpnUrl = async () => {
  const token = await getAuthToken();
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
  
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
    
    // Store the IPN ID
    ipnId = response.data.ipn_id;
    console.log("Pesapal IPN Registered successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error('Pesapal IPN Registration Error:', error.response?.data || error.message);
    throw new Error('Failed to register IPN URL with Pesapal');
  }
};

export const getIpnId = () => {
    return ipnId;
};

export const submitOrder = async (orderData: { amount: number, billing_address: any, description: string }) => {
  const token = await getAuthToken();
  const notificationId = getIpnId();
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

  if (!notificationId) {
    // Try to register it if not already registered
    await registerIpnUrl();
    const newIpnId = getIpnId();
    if (!newIpnId) {
        throw new Error("Failed to get Pesapal IPN Notification ID.");
    }
  }
  
  const payload = {
    id: uuidv4(),
    currency: 'TZS',
    amount: orderData.amount,
    description: orderData.description,
    callback_url: `${APP_URL}/pesapal/callback`,
    notification_id: getIpnId(),
    billing_address: orderData.billing_address,
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

// Auto-register IPN on server start
if (process.env.NODE_ENV === 'development') {
    setTimeout(registerIpnUrl, 1000); // Delay to ensure env vars are loaded
}
