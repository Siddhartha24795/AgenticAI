
'use server';

const DUMMY_MARKET_DATA = {
  isDummyData: true,
  records: [
    { state: 'Karnataka', district: 'Bengaluru', market: 'KR Market', commodity: 'Tomato', modal_price: '2500', yesterday_price: '2400', last_5_days_min: '2200', last_5_days_max: '2600' },
    { state: 'Karnataka', district: 'Bengaluru', market: 'KR Market', commodity: 'Onion', modal_price: '3000', yesterday_price: '3100', last_5_days_min: '2800', last_5_days_max: '3200' },
    { state: 'Karnataka', district: 'Bengaluru', market: 'KR Market', commodity: 'Potato', modal_price: '2000', yesterday_price: '2000', last_5_days_min: '1900', last_5_days_max: '2100' },
    { state: 'Maharashtra', district: 'Pune', market: 'Pune Market', commodity: 'Tomato', modal_price: '2800', yesterday_price: '2650', last_5_days_min: '2500', last_5_days_max: '2800' },
    { state: 'Maharashtra', district: 'Pune', market: 'Pune Market', commodity: 'Carrot', modal_price: '4000', yesterday_price: '3800', last_5_days_min: '3800', last_5_days_max: '4200' },
    { state: 'Maharashtra', district: 'Pune', market: 'Pune Market', commodity: 'Cabbage', modal_price: '1500', yesterday_price: '1600', last_5_days_min: '1500', last_5_days_max: '1800' },
    { state: 'Maharashtra', 'district': 'Mumbai', market: 'Dadar Market', commodity: 'Tomato', modal_price: '3200', yesterday_price: '3100', last_5_days_min: '2900', last_5_days_max: '3300' },
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
            // Note: The live API may not have the historical fields. The prompt is designed to handle missing data.
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
