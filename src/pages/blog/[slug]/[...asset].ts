import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const prerender = true;

const blogContentRoot = path.resolve('src/content/blog');
const mimeTypes: Record<string, string> = {
    '.avif': 'image/avif',
    '.excalidraw': 'application/json; charset=utf-8',
    '.gif': 'image/gif',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.json': 'application/json; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.webp': 'image/webp',
    '.xml': 'application/xml; charset=utf-8',
};

const normalizePath = (value: string) => value.split(path.sep).join('/');

const collectAssetPaths = async (dir: string, prefix = ''): Promise<string[]> => {
    const entries = await readdir(dir, { withFileTypes: true });
    const assets = await Promise.all(
        entries.map(async (entry) => {
            const relativePath = prefix ? path.posix.join(prefix, entry.name) : entry.name;
            const absolutePath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                return collectAssetPaths(absolutePath, relativePath);
            }

            if (entry.name === 'index.md') {
                return [];
            }

            return [relativePath];
        }),
    );

    return assets.flat().sort((a, b) => a.localeCompare(b));
};

export const getStaticPaths = async () => {
    const posts = await getCollection('blog');
    const paths = await Promise.all(
        posts.map(async (post) => {
            const assetPaths = await collectAssetPaths(path.join(blogContentRoot, post.id));

            return assetPaths.map((assetPath) => ({
                params: {
                    slug: post.id,
                    asset: normalizePath(assetPath),
                },
            }));
        }),
    );

    return paths.flat();
};

export const GET: APIRoute = async ({ params }) => {
    const slug = params.slug;
    const asset = params.asset;

    if (!slug || !asset) {
        return new Response(null, { status: 404 });
    }

    const relativeAssetPath = normalizePath(asset);
    const sourcePath = path.join(blogContentRoot, slug, relativeAssetPath);
    const resolvedSourcePath = path.resolve(sourcePath);
    const expectedRoot = path.resolve(blogContentRoot, slug);

    if (!resolvedSourcePath.startsWith(expectedRoot + path.sep) && resolvedSourcePath !== expectedRoot) {
        return new Response(null, { status: 404 });
    }

    if (path.basename(resolvedSourcePath) === 'index.md') {
        return new Response(null, { status: 404 });
    }

    const body = await readFile(resolvedSourcePath);
    const contentType =
        mimeTypes[path.extname(resolvedSourcePath).toLowerCase()] ?? 'application/octet-stream';
    const filename = path.basename(resolvedSourcePath);
    const encodedFilename = encodeURIComponent(filename);

    return new Response(body, {
        headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
            'X-Content-Type-Options': 'nosniff',
        },
    });
};
