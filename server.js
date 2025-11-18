const express = require('express');
const dotenv = require('dotenv');

// --- PERBAIKAN: Panggil dotenv.config() sebelum modul lain di-require ---
dotenv.config();
// -----------------------------------------------------------------------

const { scrapeAllProducts } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * @route GET /api/scrape
 * Endpoint utama untuk memulai scraping.
 * Contoh: /api/scrape?keyword=nike
 */
app.get('/api/scrape', async (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: "Missing 'keyword' query parameter. Usage: /api/scrape?keyword=<term>" });
  }

  const initialUrl = `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${encodeURIComponent(keyword)}&_sacat=0&rt=nc`;

  try {
    console.log(`Starting scrape for keyword: ${keyword}`);
    const results = await scrapeAllProducts(initialUrl);

    res.json(results);
  } catch (error) {
    console.error('Scraping failed:', error.message);
    res.status(500).json({ error: 'Failed to complete scraping process.', details: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('eBay AI Scraper API is running. Use /api/scrape?keyword=<term>');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
