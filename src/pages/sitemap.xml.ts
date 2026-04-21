import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/seo';

export const prerender = true;

const xmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
};

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (char) => xmlEscapeMap[char]);

type SitemapEntry = {
    url: string;
    lastmod?: string;
};

export const GET: APIRoute = async () => {
    const posts = await getCollection('blog');
    const entries: SitemapEntry[] = [
        { url: absoluteUrl('/') },
        { url: absoluteUrl('/blog/') },
        ...posts
            .sort((a, b) => a.data.publish_date.getTime() - b.data.publish_date.getTime())
            .map((post) => ({
                url: absoluteUrl(`/blog/${post.data.post_slug}/`),
                lastmod: (post.data.updated_date ?? post.data.publish_date).toISOString(),
            })),
    ];

    const body = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...entries.map(({ url, lastmod }) =>
            [
                '  <url>',
                `    <loc>${escapeXml(url)}</loc>`,
                lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : undefined,
                '  </url>',
            ]
                .filter(Boolean)
                .join('\n'),
        ),
        '</urlset>',
        '',
    ].join('\n');

    return new Response(body, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
        },
    });
};
