// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
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

// https://astro.build/config
export default defineConfig({
  site: "https://yorukot.me",
  adapter: cloudflare({
    imageService: "compile",
    prerenderEnvironment: "node",
  }),
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
