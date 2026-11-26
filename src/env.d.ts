type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace Cloudflare {
  interface Env {
	SITE_URL: string;
	LEGACY_SITE_URL?: string;
    GTM_ID?: string;
	META_CAPI_DATASET_ID?: string;
	META_CAPI_ACCESS_TOKEN?: string;
	META_CAPI_TEST_EVENT_CODE?: string;
	META_CAPI_RATE_LIMITER: RateLimit;
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
