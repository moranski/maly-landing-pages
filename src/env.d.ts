type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace Cloudflare {
  interface Env {
	SITE_URL: string;
    GTM_ID?: string;
	TURNSTILE_SITE_KEY?: string;
	TURNSTILE_SECRET?: string;
	RESPONDER_CLIENT_ID?: string;
	RESPONDER_CLIENT_SECRET?: string;
	RESPONDER_USER_TOKEN?: string;
	RESPONDER_LIST_ID?: string;
	SIGNUP_RATE_LIMITER: RateLimit;
  }
}

declare namespace App {
  interface Locals extends Runtime {}
}
