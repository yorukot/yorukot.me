import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
    loader: glob({
        base: './src/content/blog',
        pattern: '**/index.md',
        generateId: ({ entry }) => entry.replace(/\/index\.md$/, ''),
    }),
    schema: z.object({
        title: z.string(),
        author: z.array(z.string()),
        publish_date: z.coerce.date(),
        updated_date: z.coerce.date().optional(),
        post_slug: z.string(),
        featured: z.boolean().default(false),
        tags: z.array(z.string()).default([]),
        description: z.string(),
        lang: z.string().default('en'),
    }),
});

export const collections = { blog };
