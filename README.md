🤖 eBay AI Scraper API dengan Deepseek
Deskripsi Proyek
Proyek ini mengimplementasikan API web scraping berbasis Node.js dan Express yang dirancang untuk mengambil daftar produk dari halaman pencarian eBay. Tantangan utama dari proyek ini adalah mengintegrasikan Kecerdasan Buatan (AI), khususnya Deepseek , untuk mengekstrak data terstruktur (nama, harga, deskripsi) dari konten halaman yang tidak terstruktur.

🛠️ Setup dan Instalasi
Prasyarat
1. Node.js (v18+)
2. Akun Deepseek AI dan Kunci API Anda.
3. Chromium/Chrome (Diperlukan oleh Puppeteer)

Langkah-Langkah Instalasi :
1. Kloning Repository
- git clone [ https://github.com/AldySyahputra/codingchellenge_scraping.git ]
- cd codingchellenge_scraping

2. Instal Dependencies
- npm install

3. Konfigurasi Variabel Lingkungan
# .env
AI_API_KEY="YOUR_DEEPSEEK_API_KEY"
PORT=3000 

Cara menjalankan Proyek :
1. Jalankan Server
- npm start

2. Akses API [ Panggil endpoint /api/scrape dengan parameter keyword yang diinginkan ]
- http://localhost:3000/api/scrape?keyword=..


