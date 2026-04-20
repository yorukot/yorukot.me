import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { site } from '../data/site';

type OgImageOptions = {
    title: string;
    description: string;
    eyebrow?: string;
    tags?: string[];
    lang?: string;
};

const size = {
    width: 1200,
    height: 630,
};

const fontPath = (path: string) => resolve(process.cwd(), 'node_modules', path);

const fonts = Promise.all([
    readFile(fontPath('@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff')),
    readFile(fontPath('@fontsource/space-grotesk/files/space-grotesk-latin-500-normal.woff')),
    readFile(fontPath('@fontsource/noto-sans-tc/files/noto-sans-tc-chinese-traditional-700-normal.woff')),
    readFile(fontPath('@fontsource/noto-sans-tc/files/noto-sans-tc-chinese-traditional-400-normal.woff')),
]);

const element = (type: string, props: Record<string, unknown> | null, ...children: unknown[]) => ({
    type,
    props: {
        ...(props || {}),
        children: children.length === 1 ? children[0] : children,
    },
});

const fontFamily = 'Space Grotesk, Noto Sans TC';

const normalizeOgText = (value: string) =>
    value
        .replace(/，/g, ', ')
        .replace(/。/g, '.')
        .replace(/：/g, ': ')
        .replace(/；/g, '; ')
        .replace(/！/g, '!')
        .replace(/？/g, '?')
        .replace(/（/g, '(')
        .replace(/）/g, ')')
        .replace(/「|」|『|』/g, '"')
        .replace(/、/g, ', ');

export async function renderOgImage({
    title,
    description,
    eyebrow = site.name,
    tags = [],
    lang = site.language,
}: OgImageOptions) {
    const [
        spaceGroteskBold,
        spaceGroteskMedium,
        notoSansTcBold,
        notoSansTcRegular,
    ] = await fonts;
    const visibleTags = tags.slice(0, 4);
    const showTags = visibleTags.length > 0;
    const normalizedTitle = normalizeOgText(title);
    const normalizedDescription = normalizeOgText(description);

    const svg = await satori(
        element(
            'div',
            {
                lang,
                style: {
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: '#000000',
                    color: '#d7d7d7',
                    padding: '58px 64px',
                    fontFamily,
                    border: '1px solid #303030',
                    position: 'relative',
                },
            },
            element('div', {
                style: {
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    backgroundImage:
                        'linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
                    backgroundSize: '80px 80px',
                    opacity: 0.28,
                },
            }),
            element('div', {
                style: {
                    position: 'absolute',
                    display: 'flex',
                    width: '560px',
                    height: '560px',
                    right: '-210px',
                    bottom: '-260px',
                    border: '1px solid rgba(255,139,43,0.5)',
                    borderRadius: '999px',
                },
            }),
            element(
                'div',
                {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                    },
                },
                element(
                    'div',
                    {
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            color: '#ff8b2b',
                            fontSize: 28,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                        },
                    },
                    element('span', null, eyebrow),
                ),
                element(
                    'div',
                    {
                        style: {
                            display: 'flex',
                            color: '#8f8f8f',
                            fontSize: 24,
                            fontWeight: 500,
                        },
                    },
                    'yorukot.me',
                ),
            ),
            element(
                'div',
                {
                    style: {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '28px',
                        position: 'relative',
                    },
                },
                element(
                    'div',
                    {
                        style: {
                            display: 'flex',
                            color: '#f2f2f2',
                            fontSize: normalizedTitle.length > 46 ? 58 : 70,
                            lineHeight: 1.02,
                            fontWeight: 700,
                            maxWidth: '1000px',
                        },
                    },
                    normalizedTitle,
                ),
                element(
                    'div',
                    {
                        style: {
                            display: 'flex',
                            color: '#b8b8b8',
                            fontSize: 30,
                            lineHeight: 1.35,
                            fontWeight: 500,
                            maxWidth: '920px',
                        },
                    },
                    normalizedDescription,
                ),
            ),
            element(
                'div',
                {
                    style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        position: 'relative',
                    },
                },
                showTags
                    ? element(
                          'div',
                          {
                              style: {
                                  display: 'flex',
                                  gap: '12px',
                                  flexWrap: 'wrap',
                                  maxWidth: '760px',
                              },
                          },
                          ...visibleTags.map((tag) =>
                              element(
                                  'span',
                                  {
                                      style: {
                                          border: '1px solid #303030',
                                          color: '#b8b8b8',
                                          padding: '8px 13px',
                                          fontSize: 22,
                                          fontWeight: 500,
                                      },
                                  },
                                  `#${tag}`,
                              ),
                          ),
                      )
                    : element('div', { style: { display: 'flex' } }),
                element(
                    'div',
                    {
                        style: {
                            display: 'flex',
                            color: '#ff8b2b',
                            fontSize: 32,
                            fontWeight: 700,
                        },
                    },
                    'Yorukot',
                ),
            ),
        ) as any,
        {
            ...size,
            fonts: [
                {
                    name: 'Space Grotesk',
                    data: spaceGroteskBold,
                    weight: 700,
                    style: 'normal',
                },
                {
                    name: 'Space Grotesk',
                    data: spaceGroteskMedium,
                    weight: 500,
                    style: 'normal',
                },
                {
                    name: 'Noto Sans TC',
                    data: notoSansTcBold,
                    weight: 700,
                    style: 'normal',
                },
                {
                    name: 'Noto Sans TC',
                    data: notoSansTcRegular,
                    weight: 400,
                    style: 'normal',
                },
            ],
        },
    );

    const png = await sharp(Buffer.from(svg)).png().toBuffer();

    return new Response(new Uint8Array(png), {
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
}
