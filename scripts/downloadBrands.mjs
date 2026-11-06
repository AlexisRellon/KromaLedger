import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const token = 'pk_V1Cw9sYjS3uHrtviW2J4xg';

const institutions = {
  gcash: 'gcash.com',
  maya: 'maya.ph',
  gotyme: 'gotyme.com.ph',
  bdo: 'bdo.com.ph',
  bpi: 'bpi.com.ph',
  unionbank: 'unionbankph.com',
  seabank: 'seabank.co.id',
  maribank: 'maribank.sg',
  metrobank: 'metrobank.com.ph',
  landbank: 'landbank.com',
  rcbc: 'rcbc.com',
  tonik: 'tonikbank.com',
  coinsph: 'coins.ph',
  grabpay: 'grab.com',
  shopeepay: 'shopee.ph',
  chinabank: 'chinabank.ph',
  eastwest: 'eastwestbanker.com',
  cimb: 'cimbbank.com.ph',
  pnb: 'pnb.com.ph',
};

const brandsDir = path.join(process.cwd(), 'public', 'brands');
if (!fs.existsSync(brandsDir)) {
  fs.mkdirSync(brandsDir, { recursive: true });
}

function download(domain, id) {
  const url = `https://img.logo.dev/${domain}?token=${token}&size=128&format=png`;
  const outPath = path.join(brandsDir, `${id}.png`);
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        const fileStream = fs.createWriteStream(outPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`[OK] ${id} (${domain}) -> ${outPath}`);
          resolve(true);
        });
      } else {
        console.warn(`[WARN] ${id} HTTP ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.error(`[ERR] ${id}:`, err.message);
      resolve(false);
    });
  });
}

async function run() {
  for (const [id, domain] of Object.entries(institutions)) {
    await download(domain, id);
  }
}

run();
