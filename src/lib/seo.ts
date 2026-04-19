import { site } from '../data/site';

export const trimTrailingSlash = (path: string) => {
    if (path === '/') {
        return path;
    }

    return path.replace(/\/+$/, '');
};

export const absoluteUrl = (path = '/') =>
    new URL(trimTrailingSlash(path), site.url).toString();

export const absoluteAssetUrl = (path: string) => new URL(path, site.url).toString();

export const blogPostPath = (slug: string) => `/blog/${slug}`;

export const blogPostOgImagePath = (slug: string) => `/blog/${slug}/og.png`;

export const pageTitle = (title?: string) => title || site.title;

export const pageDescription = (description?: string) => description || site.description;

export const safeJsonLd = (data: unknown) =>
    JSON.stringify(data).replace(/</g, '\\u003c');
