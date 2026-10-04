type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

interface Env {
  GTM_ID?: string;
}

declare namespace App {
  interface Locals extends Runtime {}
}
