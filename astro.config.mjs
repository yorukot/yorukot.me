// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";

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
        return item;
      },
    }),
  ],
  markdown: {
    rehypePlugins: [optimizeLocalMarkdownImages],
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
