import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

export const getPublishedBlogPosts = async (): Promise<BlogPost[]> =>
    (await getCollection('blog')).filter((post) => !post.data.draft);
