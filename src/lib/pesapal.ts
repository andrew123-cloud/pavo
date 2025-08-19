
// src/lib/pesapal.ts
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const PESAPAL_BASE_URL = process.env.PESAPAL_BASE_URL || 'https://cybqa.pesapal.com/pesapalv3';
const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';


let tokenCache = {
  token: null as string | null,
  expires_at: 0,
};

let ipnIdCache: string | null = null;

const getErrorMessage = (error: any, context: string) => {
    console.error(`[PESAPAL_ERROR] in ${context}:`, error);
    if (axios.isAxiosError(error)) {
        const pesapalError = error.response?.data?.error;
        const responseData = JSON.stringify(error.response?.data, null, 2);
        console.error(`[PESAPAL_RESPONSE_DATA] in ${context}:`, responseData);
        if (pesapalError && pesapalError.message) {
            return `Pesapal Error: ${pesapalError.message} (Code: ${pesapalError.code})`;
        }
        return `Pesapal API request failed with status ${error.response?.status}. Response: ${responseData}`;
    }
    return error.message || 'An unknown error occurred';
};


export const getAuthToken = async (): Promise<string> => {
  if (tokenCache.token && Date.now() < tokenCache.expires_at - 60000) {
    return tokenCache.token;
  }

  if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
    throw new Error("Pesapal API credentials are not configured on the server.");
  }
  
  const authUrl = `${PESAPAL_BASE_URL}/api/Auth/RequestToken`;
  console.log(`[PESAPAL_AUTH] Requesting token from ${authUrl}`);

  try {
    const response = await axios.post(
      authUrl,
      {
        consumer_key: PESAPAL_CONSUMER_KEY,
        consumer_secret: PESAPAL_CONSUMER_SECRET,
      },
      { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } }
    );
    
    const data = response.data;
    console.log("[PESAPAL_AUTH_RESPONSE]", JSON.stringify(data, null, 2));

    const token = data.token || data.access_token;
    const expiryDate = data.expiryDate || data.expires_at;

    if (!token) {
      throw new Error("Token not found in PesaPal auth response");
    }

    tokenCache = {
      token: token,
      expires_at: new Date(expiryDate).getTime(),
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
  const ipnUrl = `${APP_URL}/api/pesapal/ipn`;
  const getListUrl = `${PESAPAL_BASE_URL}/api/URLSetup/GetIpnList`;

  try {
    console.log(`[PESAPAL_IPN] Getting IPN list from ${getListUrl}`);
    const existingIpnsResponse = await axios.get(getListUrl, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const existingIpns = existingIpnsResponse.data || [];
    console.log(`[PESAPAL_IPN] Found ${existingIpns.length} existing IPNs.`);

    const existingIpn = existingIpns.find((ipn: any) => ipn.url === ipnUrl || ipn.Url === ipnUrl);
    if (existingIpn) {
        const id = existingIpn.ipn_id || existingIpn.Id;
        if(id) {
            console.log(`[PESAPAL_IPN] Found existing IPN registration with ID: ${id}`);
            ipnIdCache = id;
            return ipnIdCache;
        }
    }

    const registerUrl = `${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`;
    console.log(`[PESAPAL_IPN] Registering new IPN URL: ${ipnUrl} at ${registerUrl}`);
    const response = await axios.post(
      registerUrl,
      { url: ipnUrl, ipn_notification_type: 'GET' },
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' } }
    );
    
    const data = response.data;
    if (data.error || !data.ipn_id) {
        throw new Error(data.error?.message || "Failed to retrieve IPN ID from Pesapal during registration.");
    }

    ipnIdCache = data.ipn_id;
    console.log(`[PESAPAL_IPN] Registered successfully, new IPN ID: ${ipnIdCache}`);
    return ipnIdCache;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, 'registerIpnUrl'));
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
      email_address: orderData.billing_address.email_address,
      phone_number: orderData.billing_address.phone_number,
      country_code: 'TZ',
      first_name: orderData.billing_address.first_name,
      last_name: orderData.billing_address.last_name,
      line_1: orderData.billing_address.line_1 || "",
      line_2: orderData.billing_address.line_2 || "",
      city: orderData.billing_address.city || "",
      state: orderData.billing_address.state || "",
      postal_code: orderData.billing_address.postal_code || "",
      zip_code: orderData.billing_address.zip_code || ""
    },
  };
  
  console.log("[PESAPAL_SUBMIT_PAYLOAD]", JSON.stringify(payload, null, 2));

  try {
    const submitUrl = `${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`;
    const response = await axios.post(
      submitUrl,
      payload,
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' } }
    );
    
    const data = response.data;
    console.log("[PESAPAL_SUBMIT_RESPONSE]", JSON.stringify(data, null, 2));
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
  const statusUrl = `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`;
  console.log(`[PESAPAL_STATUS] Getting transaction status from ${statusUrl}`);
  try {
    const response = await axios.get(
      statusUrl,
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' } }
    );

    const data = response.data;
    if (data.error) {
      throw new Error(data.error?.message || 'Unknown error from Pesapal on transaction status check');
    }
    console.log("[PESAPAL_STATUS_RESPONSE]", JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, 'getTransactionStatus'));
  }
};

    