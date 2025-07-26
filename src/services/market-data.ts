
'use server';

const DUMMY_MARKET_DATA = {
  isDummyData: true,
  records: [
    { state: 'Karnataka', district: 'Bengaluru', market: 'KR Market', commodity: 'Tomato', modal_price: '2500' },
    { state: 'Karnataka', district: 'Bengaluru', market: 'KR Market', commodity: 'Onion', modal_price: '3000' },
    { state: 'Karnataka', district: 'Bengaluru', market: 'KR Market', commodity: 'Potato', modal_price: '2000' },
    { state: 'Maharashtra', district: 'Pune', market: 'Pune Market', commodity: 'Tomato', modal_price: '2800' },
    { state: 'Maharashtra', district: 'Pune', market: 'Pune Market', commodity: 'Carrot', modal_price: '4000' },
    { state: 'Maharashtra', district: 'Pune', market: 'Pune Market', commodity: 'Cabbage', modal_price: '1500' },
    { state: 'Maharashtra', 'district': 'Mumbai', market: 'Dadar Market', commodity: 'Tomato', modal_price: '3200' },
  ],
};

export async function getMarketData(location: string) {
  const apiUrl = process.env.NEXT_PUBLIC_MANDI_API_URL;
  let dataToFilter = DUMMY_MARKET_DATA.records;
  let isDummy = true;

  if (apiUrl) {
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      });

      console.log('Mandi API Response Status Code:', response.status);

      if (response.ok) {
        const liveData = await response.json();
        if (Array.isArray(liveData) && liveData.length > 0) {
            dataToFilter = liveData;
            isDummy = false;
        } else {
             console.log('Live API returned no records. Using dummy market data.');
        }
      } else {
        const errorBody = await response.text();
        console.error('API Error Response:', errorBody);
        console.log('Live API failed. Using dummy market data as a fallback.');
      }
    } catch (error) {
      console.error('Error fetching from Mandi API:', error);
      console.log('Live API failed. Using dummy market data as a fallback.');
    }
  } else {
    console.warn('The Mandi API URL is not configured. Using dummy data.');
  }
  
  const locationLower = location.toLowerCase();
  const filteredRecords = dataToFilter.filter(record => 
    record.district?.toLowerCase() === locationLower
  );

  if (filteredRecords.length > 0) {
      return {
          records: filteredRecords,
          isDummyData: isDummy
      }
  }

  // If no records for the specific location, return all data and let AI handle it.
  return {
      records: dataToFilter,
      isDummyData: isDummy,
  };
}
