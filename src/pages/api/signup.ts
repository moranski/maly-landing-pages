// Co-authored-by: Codex <codex@openai.com>
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { handleSignup } from "../../lib/landing/signup-api";

export const prerender = false;
export const POST: APIRoute = ({ request }) => handleSignup(request, env);
