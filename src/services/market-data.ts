
'use server';

const API_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const BASE_URL = 'https://api.data.gov.in/resource/';

export async function getMarketData(location: string, limit: number = 10) {
  const apiKey = process.env.DATAGOVIN_API_KEY;
  if (!apiKey) {
    // This case will be handled by the check in Market.tsx, but is good practice to have
    throw new Error('The data.gov.in API key is not configured on the server.');
  }

  const url = new URL(`${BASE_URL}${API_RESOURCE_ID}`);
  url.searchParams.append('api-key', apiKey);
  url.searchParams.append('format', 'json');
  url.searchParams.append('offset', '0');
  url.searchParams.append('limit', String(limit));
  url.searchParams.append('filters[district]', location);
  
  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error Response:', errorBody);
      throw new Error(`Failed to fetch market data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching from data.gov.in:', error);
    throw new Error('Could not retrieve market data. Please try again later.');
  }
}
