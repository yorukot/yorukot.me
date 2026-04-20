import type { APIRoute } from 'astro';
import { renderOgImage } from '../../lib/og';

export const GET: APIRoute = () =>
    renderOgImage({
        title: 'Blog',
        description: 'Notes, experiments, and the occasional write-up from Yorukot.',
        eyebrow: '/blog',
    });
