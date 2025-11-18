const { OpenAI } = require('openai');

// Inisialisasi Klien Deepseek
const aiClient = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

// Skema JSON untuk memastikan output terstruktur
const JSON_SCHEMA = {
  type: 'object',
  properties: {
    productName: { type: 'string' },
    productPrice: { type: 'string' },
    productDescription: { type: 'string' },
  },
  required: ['productName', 'productPrice', 'productDescription'],
};

/**
 * Menggunakan AI untuk mengekstrak data terstruktur dari konten teks mentah.
 */
async function extractDataWithAI(rawText) {
  if (!rawText || rawText.length < 10) {
    return { productName: '-', productPrice: '-', productDescription: '-' };
  }

  const systemPrompt = `You are an expert data extractor. Analyze the raw text and extract the 'productName', 'productPrice', and 'productDescription'. If any field is not found or is empty, its value must be '-'. You MUST return the output as a valid JSON object matching the provided schema.`;

  try {
    const response = await aiClient.chat.completions.create({
      model: 'deepseek-chat', // Model Deepseek
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Extract data from this text: ${rawText}` },
      ],
      response_format: { type: 'json_object', schema: JSON_SCHEMA },
    });

    const jsonString = response.choices[0].message.content;
    const result = JSON.parse(jsonString);

    return {
      productName: result.productName || '-',
      productPrice: result.productPrice || '-',
      productDescription: result.productDescription || '-',
    };
  } catch (error) {
    console.error('AI Extraction Error:', error.message);
    return { productName: '-', productPrice: '-', productDescription: '-' };
  }
}

module.exports = { extractDataWithAI };
