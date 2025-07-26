
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
      cache: 'no-store', // Ensure fresh data on every request
    });

    console.log('Mandi API Response Status Code:', response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error Response:', errorBody);
      // Return empty records instead of throwing an error
      return { records: [] };
    }

    const data = await response.json();
    // The API returns an array directly, so we wrap it in a `records` object to match the expected format.
    return { records: data };
  } catch (error) {
    console.error('Error fetching from Mandi API:', error);
    // Return empty records on any failure to prevent crashing.
    return { records: [] };
  }
}
