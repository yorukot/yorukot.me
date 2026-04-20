import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';

const root = new URL('..', import.meta.url);
const blogDir = new URL('src/content/blog/', root);

const frontmatterPattern = /^---\n([\s\S]*?)\n---/;

const readText = (relativePath) => readFile(new URL(relativePath, root), 'utf8');

const parseFrontmatter = (markdown, filePath) => {
    const match = markdown.match(frontmatterPattern);
    assert.ok(match, `${filePath} must start with frontmatter`);

    const data = {};

    for (const line of match[1].split('\n')) {
        const field = line.match(/^([a-z_]+):\s*(.*)$/);

        if (!field) {
            continue;
        }

        const [, key, rawValue] = field;
        data[key] = rawValue.trim().replace(/^['"]|['"]$/g, '');
    }

    return data;
};

const readBlogPosts = async () => {
    const entries = await readdir(blogDir, { withFileTypes: true });
    const posts = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }

        const filePath = path.join('src/content/blog', entry.name, 'index.md');
        const markdown = await readText(filePath);
        posts.push({
            filePath,
            data: parseFrontmatter(markdown, filePath),
        });
    }

    return posts;
};

test('site config uses the canonical domain and feed paths', async () => {
    const siteConfig = await readText('src/data/site.ts');

    assert.match(siteConfig, /url:\s*'https:\/\/yorukot\.me'/);
    assert.match(siteConfig, /rssPath:\s*'\/rss\.xml'/);
    assert.match(siteConfig, /sitemapPath:\s*'\/sitemap-index\.xml'/);
    assert.match(siteConfig, /defaultOgImage:\s*'\/og\.png'/);
});

test('blog posts expose complete SEO frontmatter', async () => {
    const posts = await readBlogPosts();

    assert.ok(posts.length > 0, 'expected at least one blog post');

    for (const { filePath, data } of posts) {
        assert.ok(data.title, `${filePath} needs a title`);
        assert.ok(data.description, `${filePath} needs a description`);
        assert.ok(data.post_slug, `${filePath} needs a post_slug`);
        assert.ok(data.publish_date, `${filePath} needs a publish_date`);
        assert.ok(data.lang, `${filePath} needs a lang`);
        assert.ok(
            data.description.length >= 12 && data.description.length <= 180,
            `${filePath} description should stay between 12 and 180 characters`,
        );
        assert.ok(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.post_slug),
            `${filePath} post_slug should be URL-safe kebab-case`,
        );
    }
});

test('blog post slugs are unique', async () => {
    const posts = await readBlogPosts();
    const slugs = posts.map((post) => post.data.post_slug);
    const uniqueSlugs = new Set(slugs);

    assert.equal(uniqueSlugs.size, slugs.length, 'post_slug values must be unique');
});

test('shortlinks expose the expected aliases', async () => {
    const { shortlinkMap } = await import(new URL('src/data/shortlinks.ts', root));

    const expectedShortlinks = new Map([
        ['gh', 'https://github.com/yorukot'],
        ['github', 'https://github.com/yorukot'],
        ['stackoverflow', 'https://stackoverflow.com/users/15810000/yorukot'],
        ['stack-overflow', 'https://stackoverflow.com/users/15810000/yorukot'],
        ['so', 'https://stackoverflow.com/users/15810000/yorukot'],
        ['telegram', 'https://t.me/yorukot'],
        ['tg', 'https://t.me/yorukot'],
        ['discord', 'https://discord.com/users/yorukot'],
        ['dc', 'https://discord.com/users/yorukot'],
        ['email', 'mailto:hello@yorukot.me'],
        ['mail', 'mailto:hello@yorukot.me'],
        ['gpg', 'https://yorukot.me/.well-known/openpgpkey/hu/aeii9rmagouy1owpp7e5ftpxjof7h41n?l=hi'],
        ['youtube', 'https://www.youtube.com/@yorukot'],
        ['yt', 'https://www.youtube.com/@yorukot'],
        ['donate', 'https://ko-fi.com/yorukot'],
        ['sponsor', 'https://ko-fi.com/yorukot'],
        ['ko-fi', 'https://ko-fi.com/yorukot'],
        ['kofi', 'https://ko-fi.com/yorukot'],
    ]);

    assert.equal(shortlinkMap.size, expectedShortlinks.size);

    for (const [slug, href] of expectedShortlinks) {
        assert.equal(shortlinkMap.get(slug), href, `${slug} should redirect to ${href}`);
    }
});
