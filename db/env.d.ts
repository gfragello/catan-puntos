declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ADMIN_PIN: string;
    ADMIN_SESSION_SECRET: string;
  }
}
