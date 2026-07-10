// Fail fast on obviously-misconfigured environment before build/deploy.
//
// Default (lenient) mode runs in `npm run check`: missing vars are tolerated
// (local/CI `check` may omit them), but PRESENT-but-malformed values fail,
// because those ship broken links silently.
//
// Strict mode (`--strict` or VALIDATE_ENV_STRICT=1) additionally REQUIRES the
// vars the app cannot run without. Use it in a predeploy step where the real
// environment is expected to be fully configured (BLD-5).
const strict =
  process.argv.includes("--strict") || process.env.VALIDATE_ENV_STRICT === "1";

let failed = false;

function bad(msg) {
  console.error(`✗ env: ${msg}`);
  failed = true;
}

// Vars the app genuinely cannot function without in production.
const REQUIRED = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

if (strict) {
  for (const name of REQUIRED) {
    if (!process.env[name] || !process.env[name].trim()) {
      bad(`${name} is required but missing (strict mode).`);
    }
  }
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (siteUrl) {
  try {
    const u = new URL(siteUrl);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      bad(`NEXT_PUBLIC_SITE_URL must be http(s): "${siteUrl}"`);
    }
  } catch {
    bad(`NEXT_PUBLIC_SITE_URL is not a valid absolute URL: "${siteUrl}"`);
  }
}

const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supaUrl) {
  try {
    new URL(supaUrl);
  } catch {
    bad(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: "${supaUrl}"`);
  }
}

if (failed) process.exit(1);
console.log(
  `✓ env: no ${strict ? "missing or " : ""}malformed environment variables detected`,
);
