import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const publicDir = path.join(projectRoot, "public");

const source = path.join(publicDir, "rippotai_logo.png");

await sharp(source)
  .resize(192, 192, {
    fit: "contain",
  })
  .png()
  .toFile(path.join(publicDir, "pwa-192x192.png"));

await sharp(source)
  .resize(512, 512, {
    fit: "contain",
  })
  .png()
  .toFile(path.join(publicDir, "pwa-512x512.png"));

await sharp(source)
  .resize(180, 180, {
    fit: "contain",
  })
  .png()
  .toFile(path.join(publicDir, "apple-touch-icon.png"));

console.log("PWA icons generated successfully.");
