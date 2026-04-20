import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const source = path.join(publicDir, 'favicon-orig.png');

const pngTargets = [
    ['favicon-16x16.png', 16],
    ['favicon-32x32.png', 32],
    ['apple-touch-icon.png', 180],
    ['android-chrome-192x192.png', 192],
    ['android-chrome-512x512.png', 512],
];

const icoSizes = [16, 32, 48, 64, 128, 256];

const renderPng = (size) =>
    sharp(source)
        .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png({ compressionLevel: 9 })
        .toBuffer();

const writeIco = async () => {
    const images = await Promise.all(icoSizes.map(async (size) => [size, await renderPng(size)]));
    const headerSize = 6;
    const entrySize = 16;
    const directorySize = headerSize + images.length * entrySize;
    const header = Buffer.alloc(directorySize);

    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(images.length, 4);

    let imageOffset = directorySize;

    images.forEach(([size, image], index) => {
        const entryOffset = headerSize + index * entrySize;

        header.writeUInt8(size === 256 ? 0 : size, entryOffset);
        header.writeUInt8(size === 256 ? 0 : size, entryOffset + 1);
        header.writeUInt8(0, entryOffset + 2);
        header.writeUInt8(0, entryOffset + 3);
        header.writeUInt16LE(1, entryOffset + 4);
        header.writeUInt16LE(32, entryOffset + 6);
        header.writeUInt32LE(image.length, entryOffset + 8);
        header.writeUInt32LE(imageOffset, entryOffset + 12);

        imageOffset += image.length;
    });

    await writeFile(path.join(publicDir, 'favicon.ico'), Buffer.concat([header, ...images.map(([, image]) => image)]));
};

const writeManifest = async () => {
    const manifest = {
        name: 'Yorukot',
        short_name: 'Yorukot',
        icons: [
            {
                src: '/android-chrome-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable',
            },
            {
                src: '/android-chrome-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable',
            },
        ],
        theme_color: '#ff8b2b',
        background_color: '#000000',
        display: 'standalone',
    };

    await writeFile(path.join(publicDir, 'site.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);
};

await mkdir(publicDir, { recursive: true });

for (const [filename, size] of pngTargets) {
    await writeFile(path.join(publicDir, filename), await renderPng(size));
}

await writeIco();
await writeManifest();

console.log([
    'public/favicon.ico',
    ...pngTargets.map(([filename]) => `public/${filename}`),
    'public/site.webmanifest',
].join('\n'));
