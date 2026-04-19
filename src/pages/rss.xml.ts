import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { blogPostPath } from '../lib/seo';

export const GET: APIRoute = async (context) => {
    const posts = (await getCollection('blog')).sort(
        (a, b) => b.data.publish_date.getTime() - a.data.publish_date.getTime(),
    );

    return rss({
        title: `${site.name} Blog`,
        description: 'Notes, experiments, and write-ups from Yorukot.',
        site: context.site ?? site.url,
        trailingSlash: false,
        items: posts.map((post) => ({
            title: post.data.title,
            description: post.data.description,
            link: blogPostPath(post.data.post_slug),
            pubDate: post.data.publish_date,
            author: post.data.author.join(', '),
            categories: post.data.tags,
        })),
        customData: `<language>${site.language}</language>`,
    });
};
