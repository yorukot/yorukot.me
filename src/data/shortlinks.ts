export type Shortlink = {
  slug: string | readonly string[];
  href: string;
};

export const shortlinks = [
  {
    slug: ["gh", "github"],
    href: "https://github.com/yorukot",
  },
  {
    slug: ["telegram", "tg"],
    href: "https://t.me/yorukot",
  },
  {
    slug: ["discord", "dc"],
    href: "https://discord.com/users/yorukot",
  },
  {
    slug: ["email", "mail"],
    href: "mailto:hello@yorukot.me",
  },
  {
    slug: ["stackoverflow", "stack-overflow", "so"],
    href: "https://stackoverflow.com/users/15810000/yorukot",
  },
  {
    slug: "gpg",
    href: "https://yorukot.me/.well-known/openpgpkey/hu/aeii9rmagouy1owpp7e5ftpxjof7h41n?l=hi",
  },
  {
    slug: ["youtube", "yt"],
    href: "https://www.youtube.com/@yorukot",
  },
  {
    slug: ["donate", "sponsor", "ko-fi", "kofi"],
    href: "https://ko-fi.com/yorukot",
  },
] as const satisfies readonly Shortlink[];

const toSlugList = (slug: Shortlink["slug"]) =>
  Array.isArray(slug) ? slug : [slug];

export const shortlinkEntries = shortlinks.flatMap((shortlink) =>
  toSlugList(shortlink.slug).map((slug) => ({
    slug,
    href: shortlink.href,
  })),
);

export const shortlinkMap = new Map(
  shortlinkEntries.map((shortlink) => [shortlink.slug, shortlink.href]),
);
