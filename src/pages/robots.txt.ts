import type { APIRoute } from 'astro';
import { site } from '../data/site';

export const GET: APIRoute = ({ site: astroSite }) => {
    const sitemapUrl = new URL(site.sitemapPath, astroSite ?? site.url);

    return new Response(
        [
            'User-agent: *',
            'Allow: /',
            '',
            `Sitemap: ${sitemapUrl.toString()}`,
            '',
        ].join('\n'),
        {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        },
    );
};
