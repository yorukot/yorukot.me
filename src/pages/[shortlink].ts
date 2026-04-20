import type { APIRoute } from "astro";
import { shortlinkMap } from "../data/shortlinks";

export const prerender = false;

export const GET: APIRoute = ({ params }) => {
  const slug = params.shortlink;
  const href = slug ? shortlinkMap.get(slug) : undefined;

  if (!href) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  return Response.redirect(href, 302);
};
