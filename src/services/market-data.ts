
'use server';

const DUMMY_MARKET_DATA = {
  isDummyData: true,
  records: [
    { state: 'Karnataka', district: 'Bengaluru', market: 'KR Market', commodity: 'Tomato', modal_price: '25' },
    { state: 'Karnataka', district: 'Bengaluru', market: 'KR Market', commodity: 'Onion', modal_price: '30' },
    { state: 'Karnataka', district: 'Bengaluru', market: 'KR Market', commodity: 'Potato', modal_price: '20' },
    { state: 'Maharashtra', district: 'Pune', market: 'Pune Market', commodity: 'Carrot', modal_price: '40' },
    { state: 'Maharashtra', district: 'Pune', market: 'Pune Market', commodity: 'Cabbage', modal_price: '15' },
  ],
};

export async function getMarketData() {
  const apiUrl = process.env.NEXT_PUBLIC_MANDI_API_URL;
  if (!apiUrl) {
    console.warn('The Mandi API URL is not configured. Returning dummy data.');
    return DUMMY_MARKET_DATA;
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
      console.log('Live API failed. Using dummy market data as a fallback.');
      return DUMMY_MARKET_DATA;
    }

    const data = await response.json();
    // The API returns an array directly, so we wrap it in a `records` object to match the expected format.
    return { records: data };
  } catch (error) {
    console.error('Error fetching from Mandi API:', error);
    console.log('Live API failed. Using dummy market data as a fallback.');
    return DUMMY_MARKET_DATA;
  }
}
