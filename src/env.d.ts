type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace Cloudflare {
  interface Env {
    GTM_ID?: string;
  }
}

declare namespace App {
  interface Locals extends Runtime {}
}
