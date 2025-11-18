const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { extractDataWithAI } = require('./aiExtractor');
// const fs = require('fs'); // Tidak diperlukan lagi setelah debugging selesai

// Gunakan stealth plugin untuk menghindari deteksi bot
puppeteer.use(StealthPlugin());

// User Agent untuk meniru browser sungguhan
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Fungsi pembantu untuk inisialisasi browser
async function getBrowser() {
  return puppeteer.launch({
    // SOLUSI PEMBLOKIRAN: Jalankan dalam mode non-headless agar terlihat seperti pengguna nyata
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled', '--window-size=1920,1080', '--no-zygote'],
  });
}

/**
 * Mengambil data produk mentah (URL, nama, harga) dari satu halaman daftar.
 */
async function scrapeProductList(page) {
  const containerSelector = '#srp-river-results';
  await page.waitForSelector(containerSelector, { timeout: 60000 });

  // Selector produk yang paling stabil: menggunakan data attribute
  const itemSelector = 'div[data-component-type="s-item"]';

  const rawProducts = await page.evaluate(
    (cSelector, iSelector) => {
      const products = [];
      const container = document.querySelector(cSelector);

      if (!container) return products;

      const productNodes = container.querySelectorAll(iSelector);

      productNodes.forEach((node) => {
        const titleNode = node.querySelector('.s-item__title');
        const priceNode = node.querySelector('.s-item__price');
        const linkNode = node.querySelector('.s-item__link');

        if (titleNode && linkNode && linkNode.href) {
          products.push({
            rawTitle: titleNode.innerText.trim() || '-',
            rawPrice: priceNode ? priceNode.innerText.trim() : '-',
            productUrl: linkNode.href,
          });
        }
      });
      return products;
    },
    containerSelector,
    itemSelector
  );

  return rawProducts.filter((p) => p.productUrl !== '-');
}

/**
 * Mengunjungi laman detail produk dan menggunakan AI untuk mengekstrak deskripsi.
 */
async function scrapeDetailAndExtract(url) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  let result = { productName: '-', productPrice: '-', productDescription: '-' };

  try {
    await page.setUserAgent(USER_AGENT);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const rawContent = await page
      .evaluate(() => {
        const descArea = document.querySelector('#vi-desc-main, .item-desc-details') || document.body;
        return descArea ? descArea.innerText.trim() : 'Content area not found.';
      })
      .catch(() => 'Error fetching content.');

    const aiData = await extractDataWithAI(rawContent);

    result = {
      productName: aiData.productName,
      productPrice: aiData.productPrice,
      productDescription: aiData.productDescription,
    };
  } catch (e) {
    console.error(`Error scraping detail for ${url}: ${e.message}`);
  } finally {
    await browser.close();
  }
  return result;
}

/**
 * Fungsi utama untuk scraping semua produk di seluruh paginasi.
 */
async function scrapeAllProducts(initialUrl) {
  let rawProductList = [];
  let pageNumber = 1;

  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setUserAgent(USER_AGENT);

  try {
    while (true) {
      const currentUrl = `${initialUrl}&_pgn=${pageNumber}`;
      console.log(`Scraping page ${pageNumber}...`);

      await page.goto(currentUrl, { waitUntil: 'load', timeout: 60000 });

      // Tambahkan delay 5 detik untuk memastikan JavaScript dan data dimuat
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const productsOnPage = await scrapeProductList(page);

      if (productsOnPage.length === 0) {
        console.log(`No more products found after page ${pageNumber}.`);
        break;
      }

      rawProductList.push(...productsOnPage);

      const nextButton = await page.$('.pagination__next');
      if (!nextButton) {
        console.log('Next pagination button not found. Assuming last page.');
        break;
      }

      pageNumber++;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (e) {
    console.error('Error during main list scraping:', e.message);
  } finally {
    await browser.close();
  }

  console.log(`Total products found: ${rawProductList.length}. Starting detail extraction...`);

  const productsWithDetails = await Promise.all(
    rawProductList.map(async (product) => {
      if (product.productUrl !== '-') {
        const aiData = await scrapeDetailAndExtract(product.productUrl);

        return {
          productName: aiData.productName,
          productPrice: aiData.productPrice,
          productDescription: aiData.productDescription,
          productUrl: product.productUrl,
        };
      }
      return { productName: '-', productPrice: '-', productDescription: '-', productUrl: '-' };
    })
  );

  return productsWithDetails;
}

module.exports = { scrapeAllProducts };
