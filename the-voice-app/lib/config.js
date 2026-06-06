const config = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  calApiKey: process.env.CAL_API_KEY,
  calEventTypeId: process.env.CAL_EVENT_TYPE_ID || '1',
  calApiVersion: '2024-08-13',
  calBaseUrl: 'https://api.cal.com/v2',
  chatModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  embeddingModel: 'embedding-001',
  personaName: 'Amrutha Satheesan',
};

export default config;
