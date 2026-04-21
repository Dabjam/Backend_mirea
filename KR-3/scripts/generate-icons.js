const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const input = path.join(__dirname, "..", "icons", "source-checklist.svg");
const iconsDir = path.join(__dirname, "..", "icons");
const screenshotsDir = path.join(__dirname, "..", "screenshots");

const standardTargets = [
  { size: 16, filename: "favicon-16x16.png" },
  { size: 32, filename: "favicon-32x32.png" },
  { size: 48, filename: "favicon-48x48.png" },
  { size: 64, filename: "favicon-64x64.png" },
  { size: 128, filename: "favicon-128x128.png" },
  { size: 192, filename: "icon-192.png" },
  { size: 256, filename: "favicon-256x256.png" },
  { size: 512, filename: "favicon-512x512.png" },
  { size: 512, filename: "icon-512.png" }
];

const maskableTargets = [
  { size: 192, filename: "maskable-192.png" },
  { size: 512, filename: "maskable-512.png" }
];

const palette = {
  white: { r: 255, g: 255, b: 255, alpha: 1 },
  blue: { r: 47, g: 128, b: 237, alpha: 1 },
  lightBlue: { r: 238, g: 246, b: 255, alpha: 1 }
};

async function createGlyph(size, tint = null) {
  const glyph = sharp(input, { density: 1200 }).resize(size, size, { fit: "contain" }).png();
  if (!tint) return glyph.toBuffer();

  return glyph
    .composite([
      {
        input: {
          create: {
            width: size,
            height: size,
            channels: 4,
            background: tint
          }
        },
        blend: "dest-in"
      }
    ])
    .png()
    .toBuffer();
}

async function createStandardIcon(size, filename) {
  const canvas = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: palette.lightBlue
    }
  });

  const inset = Math.round(size * 0.12);
  const cardSize = size - inset * 2;
  const iconSize = Math.round(size * 0.58);
  const glyph = await createGlyph(iconSize);

  const roundedRect = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${inset}" y="${inset}" width="${cardSize}" height="${cardSize}" rx="${Math.round(size * 0.18)}" fill="#FFFFFF"/>
      <rect x="${inset}" y="${inset}" width="${cardSize}" height="${cardSize}" rx="${Math.round(size * 0.18)}" fill="none" stroke="#D5E8FF" stroke-width="${Math.max(2, Math.round(size * 0.03))}"/>
    </svg>
  `;

  await canvas
    .composite([
      { input: Buffer.from(roundedRect) },
      {
        input: glyph,
        left: Math.round((size - iconSize) / 2),
        top: Math.round((size - iconSize) / 2)
      }
    ])
    .png()
    .toFile(path.join(iconsDir, filename));
}

async function createMaskableIcon(size, filename) {
  const iconSize = Math.round(size * 0.46);
  const glyph = await createGlyph(iconSize, palette.white);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: palette.blue
    }
  })
    .composite([
      {
        input: glyph,
        left: Math.round((size - iconSize) / 2),
        top: Math.round((size - iconSize) / 2)
      }
    ])
    .png()
    .toFile(path.join(iconsDir, filename));
}

function createScreenshotSvg({ width, height, mobile = false }) {
  const sidebarWidth = mobile ? 0 : 240;
  const contentX = mobile ? 24 : sidebarWidth + 32;
  const cardWidth = mobile ? width - 48 : 250;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" rx="28" fill="#DCEFFF"/>
      <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="26" fill="#F4F8FC"/>
      ${mobile ? "" : `<rect x="24" y="24" width="${sidebarWidth}" height="${height - 48}" rx="26" fill="#FFFFFF"/>`}
      ${mobile ? "" : `<rect x="56" y="90" width="120" height="16" rx="8" fill="#9CB6D6"/>`}
      ${mobile ? "" : `<rect x="56" y="140" width="150" height="44" rx="16" fill="#EEF6FF"/>`}
      ${mobile ? "" : `<rect x="56" y="196" width="150" height="44" rx="16" fill="#FFFFFF"/>`}
      ${mobile ? "" : `<rect x="56" y="252" width="150" height="44" rx="16" fill="#FFFFFF"/>`}
      <text x="${contentX}" y="${mobile ? 92 : 96}" font-family="Inter, Segoe UI, Arial" font-size="${mobile ? 18 : 16}" fill="#6B7A90">Progressive Web App</text>
      <text x="${contentX}" y="${mobile ? 138 : 152}" font-family="Inter, Segoe UI, Arial" font-size="${mobile ? 38 : 54}" font-weight="700" fill="#102033">Панель заметок</text>
      <rect x="${contentX}" y="${mobile ? 170 : 188}" width="${mobile ? 180 : 300}" height="${mobile ? 16 : 18}" rx="8" fill="#C8DAEF"/>
      <rect x="${contentX}" y="${mobile ? 208 : 236}" width="${mobile ? width - 48 : width - contentX - 32}" height="${mobile ? 190 : 140}" rx="24" fill="#FFFFFF"/>
      <rect x="${contentX + 24}" y="${mobile ? 236 : 268}" width="${mobile ? 160 : 140}" height="14" rx="7" fill="#9CB6D6"/>
      <rect x="${contentX + 24}" y="${mobile ? 266 : 300}" width="${mobile ? width - 96 : 320}" height="18" rx="9" fill="#D5E8FF"/>
      <rect x="${contentX + 24}" y="${mobile ? 298 : 332}" width="${mobile ? width - 96 : 220}" height="18" rx="9" fill="#E6EEF8"/>
      <rect x="${contentX}" y="${mobile ? 420 : 404}" width="${cardWidth}" height="${mobile ? 130 : 180}" rx="22" fill="#FFFFFF"/>
      ${mobile ? "" : `<rect x="${contentX + 274}" y="404" width="250" height="180" rx="22" fill="#FFFFFF"/>`}
      ${mobile ? "" : `<rect x="${contentX + 548}" y="404" width="250" height="180" rx="22" fill="#FFFFFF"/>`}
      <rect x="${contentX + 24}" y="${mobile ? 448 : 432}" width="92" height="28" rx="14" fill="#EEF6FF"/>
      <text x="${contentX + 42}" y="${mobile ? 467 : 451}" font-family="Inter, Segoe UI, Arial" font-size="14" font-weight="700" fill="#2F80ED">Note</text>
      <rect x="${contentX + 24}" y="${mobile ? 490 : 482}" width="${mobile ? width - 96 : 180}" height="18" rx="9" fill="#D5E8FF"/>
      <rect x="${contentX + 24}" y="${mobile ? 522 : 514}" width="${mobile ? width - 120 : 140}" height="16" rx="8" fill="#E6EEF8"/>
    </svg>
  `;
}

async function createScreenshots() {
  const wide = createScreenshotSvg({ width: 1280, height: 720 });
  const narrow = createScreenshotSvg({ width: 720, height: 1280, mobile: true });

  await sharp(Buffer.from(wide)).png().toFile(path.join(screenshotsDir, "app-wide.png"));
  await sharp(Buffer.from(narrow)).png().toFile(path.join(screenshotsDir, "app-mobile.png"));
}

async function run() {
  fs.mkdirSync(iconsDir, { recursive: true });
  fs.mkdirSync(screenshotsDir, { recursive: true });

  for (const target of standardTargets) {
    await createStandardIcon(target.size, target.filename);
  }

  for (const target of maskableTargets) {
    await createMaskableIcon(target.size, target.filename);
  }

  await sharp(path.join(iconsDir, "icon-192.png"))
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, "apple-touch-icon.png"));

  await createScreenshots();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
