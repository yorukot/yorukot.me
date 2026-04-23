import type { APIRoute } from 'astro';
import { getPublishedBlogPosts } from '../../../data/blog';
import { renderOgImage } from '../../../lib/og';

export async function getStaticPaths() {
    const posts = await getPublishedBlogPosts();

    return posts.map((post) => ({
        params: { slug: post.data.post_slug },
        props: { post },
    }));
}

export const GET: APIRoute = ({ props }) =>
    renderOgImage({
        title: props.post.data.title,
        description: props.post.data.description,
        eyebrow: '/blog',
        tags: props.post.data.tags,
        lang: props.post.data.lang,
    });
