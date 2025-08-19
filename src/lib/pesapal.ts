// src/lib/pesapal.ts
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const PESAPAL_BASE_URL = process.env.PESAPAL_BASE_URL;
const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// In-memory cache for token and IPN ID.
// In a production/scaled environment, this should be moved to a more persistent cache like Redis.
let tokenCache = {
  token: null as string | null,
  expires_at: 0,
};

let ipnIdCache: string | null = null;

const getErrorMessage = (error: any, context: string) => {
    console.error(`[PESAPAL_ERROR] in ${context}:`, error);
    if (axios.isAxiosError(error)) {
        const pesapalError = error.response?.data?.error;
        if (pesapalError && pesapalError.message) {
            return `Pesapal Error: ${pesapalError.message} (Code: ${pesapalError.code})`;
        }
        return `Pesapal API request failed with status ${error.response?.status}: ${error.response?.data?.message || error.message}`;
    }
    return error.message || 'An unknown error occurred';
};


export const getAuthToken = async (): Promise<string> => {
  if (tokenCache.token && Date.now() < tokenCache.expires_at - 60000) { // Refresh 1 min before expiry
    return tokenCache.token;
  }

  if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET || !PESAPAL_BASE_URL) {
    throw new Error("Pesapal API credentials or Base URL are not configured on the server.");
  }

  try {
    const response = await axios.post(
      `${PESAPAL_BASE_URL}/api/Auth/RequestToken`,
      {
        consumer_key: PESAPAL_CONSUMER_KEY,
        consumer_secret: PESAPAL_CONSUMER_SECRET,
      },
      { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } }
    );
    
    const data = response.data;
    if (data.error || !data.token) {
      throw new Error(data.error?.message || "Token not found in PesaPal auth response");
    }

    tokenCache = {
      token: data.token,
      expires_at: new Date(data.expiryDate).getTime(),
    };
    return tokenCache.token;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, 'getAuthToken'));
  }
};

export const registerIpnUrl = async (): Promise<string> => {
  if (ipnIdCache) {
    return ipnIdCache;
  }

  const token = await getAuthToken();
  
  if (!APP_URL) {
      throw new Error("Application URL (NEXT_PUBLIC_APP_URL) is not set.");
  }
  const ipnUrl = `${APP_URL}/api/pesapal/ipn`;

  try {
    // First, check if the IPN is already registered
    const existingIpns = await axios.get(`${PESAPAL_BASE_URL}/api/URLSetup/GetIpnList`, {
        headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data || []);

    const existingIpn = existingIpns.find((ipn: any) => ipn.url === ipnUrl);
    if (existingIpn && existingIpn.ipn_id) {
        console.log("Found existing IPN registration:", existingIpn.ipn_id);
        ipnIdCache = existingIpn.ipn_id;
        return ipnIdCache;
    }

    // If not found, register it
    console.log(`Registering new IPN URL: ${ipnUrl}`);
    const response = await axios.post(
      `${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`,
      { url: ipnUrl, ipn_notification_type: 'GET' },
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' } }
    );
    
    const data = response.data;
    if (data.error || !data.ipn_id) {
        throw new Error(data.error?.message || "Failed to retrieve IPN ID from Pesapal during registration.");
    }

    ipnIdCache = data.ipn_id;
    console.log("Pesapal IPN Registered successfully:", ipnIdCache);
    return ipnIdCache;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, 'registerIpnUrl'));
  }
};

export const submitOrder = async (orderData: { amount: number, billing_address: any, description: string }) => {
  const token = await getAuthToken();
  const notificationId = await registerIpnUrl(); // This now handles getting/creating the IPN ID

  const payload = {
    id: uuidv4(), // Unique merchant reference ID for each order
    currency: 'TZS',
    amount: orderData.amount,
    description: orderData.description,
    callback_url: `${APP_URL}/pesapal/callback`,
    notification_id: notificationId,
    billing_address: {
      ...orderData.billing_address,
      country_code: 'TZ' // Assuming Tanzania
    },
  };

  try {
    const response = await axios.post(
      `${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`,
      payload,
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' } }
    );
    
    const data = response.data;
    if (data.error || !data.redirect_url) {
        throw new Error(data.error?.message || 'Pesapal submission failed: redirect_url not found.');
    }
    return data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, 'submitOrder'));
  }
};

export const getTransactionStatus = async (orderTrackingId: string) => {
  const token = await getAuthToken();
  try {
    const response = await axios.get(
      `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' } }
    );

    const data = response.data;
    if (data.error) {
      throw new Error(data.error?.message || 'Unknown error from Pesapal on transaction status check');
    }
    return data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, 'getTransactionStatus'));
  }
};
