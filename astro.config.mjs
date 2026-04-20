// @ts-check
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";

/**
 * @param {string} path
 */
const trimTrailingSlash = (path) => {
  if (path === "/") {
    return path;
  }

  return path.replace(/\/+$/, "");
};

/**
 * @param {string} frontmatter
 * @param {string} key
 */
const frontmatterValue = (frontmatter, key) => {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));

  return match?.[1]?.trim();
};

const blogLastmodMap = () => {
  const root = join(process.cwd(), "src", "content", "blog");
  const entries = new Map();

  if (!existsSync(root)) {
    return entries;
  }

  /**
   * @param {string} directory
   */
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        visit(entryPath);
        continue;
      }

      if (entry.name !== "index.md") {
        continue;
      }

      const markdown = readFileSync(entryPath, "utf8");
      const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---/)?.[1];

      if (!frontmatter) {
        continue;
      }

      const slug = frontmatterValue(frontmatter, "post_slug");
      const date = frontmatterValue(frontmatter, "updated_date") ?? frontmatterValue(frontmatter, "publish_date");

      if (slug && date) {
        entries.set(`/blog/${slug}`, new Date(date));
      }
    }
  };

  visit(root);

  return entries;
};

const optimizeLocalMarkdownImages = () => {
  /**
   * @param {any} node
   */
  const visit = (node) => {
    if (node?.type === "element" && node.tagName === "img") {
      const src = node.properties?.src;

      if (typeof src === "string" && src.startsWith(".")) {
        node.properties.format = "webp";
      }
    }

    if (Array.isArray(node?.children)) {
      node.children.forEach(visit);
    }
  };

  /**
   * @param {any} tree
   */
  return (tree) => {
    visit(tree);
  };
};

const demoteMarkdownHeadings = () => {
  /**
   * @param {any} node
   */
  const visit = (node) => {
    if (node?.type === "element" && /^h[1-5]$/.test(node.tagName)) {
      const level = Number(node.tagName.slice(1));

      node.tagName = `h${level + 1}`;
    }

    if (Array.isArray(node?.children)) {
      node.children.forEach(visit);
    }
  };

  /**
   * @param {any} tree
   */
  return (tree) => {
    visit(tree);
  };
};

const lastmodByPath = blogLastmodMap();

// https://astro.build/config
export default defineConfig({
  site: "https://yorukot.me",
  adapter: cloudflare({
    imageService: "compile",
    prerenderEnvironment: "node",
  }),
  integrations: [
    sitemap({
      serialize(item) {
        const url = new URL(item.url);

        if (url.pathname !== "/") {
          url.pathname = url.pathname.replace(/\/+$/, "");
        }

        item.url = url.toString();
        item.lastmod = lastmodByPath.get(trimTrailingSlash(url.pathname));

        return item;
      },
    }),
  ],
  markdown: {
    rehypePlugins: [demoteMarkdownHeadings, optimizeLocalMarkdownImages],
  },
  vite: {
    plugins: [
      tailwindcss(),
      Icons({
        compiler: "astro",
      }),
    ],
  },
});
