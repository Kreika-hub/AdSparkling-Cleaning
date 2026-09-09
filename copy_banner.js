const fs = require('fs');

const src = "C:/Users/HP/.gemini/antigravity/brain/2416ffea-2068-4110-88c2-ba00507aec95/ad_sparkling_official_banner_1788906841423.jpg";
const destRoot = "c:/Users/HP/Desktop/ANGGIE/ADsparking/og-banner.jpg";
const destAssets = "c:/Users/HP/Desktop/ANGGIE/ADsparking/assets/images/og-banner.jpg";

try {
  const buf = fs.readFileSync(src);
  fs.writeFileSync(destRoot, buf);
  fs.writeFileSync(destAssets, buf);
  console.log("SUCCESS_COPIED_SIZE_" + buf.length);
} catch (err) {
  console.error("FAIL:", err.message);
}
