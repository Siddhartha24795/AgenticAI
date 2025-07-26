
'use server';

export async function getMarketData() {
  const apiUrl = process.env.NEXT_PUBLIC_MANDI_API_URL;
  if (!apiUrl) {
    console.warn('The Mandi API URL is not configured on the server. Please add NEXT_PUBLIC_MANDI_API_URL to your .env file. Returning empty data.');
    return { records: [] };
  }
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('Mandi API Response Status Code:', response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error Response:', errorBody);
      throw new Error(`Failed to fetch market data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    // The new API returns an array directly, so we wrap it in a `records` object to match the expected format.
    return { records: data };
  } catch (error) {
    console.error('Error fetching from Mandi API:', error);
    throw new Error('Could not retrieve market data. Please try again later.');
  }
}
