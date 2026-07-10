// Fail fast on obviously-misconfigured environment before build/deploy.
// Runs in `npm run check`. Missing vars are tolerated (local/CI may omit them);
// PRESENT-but-malformed values fail, because those ship broken links silently.
let failed = false;

function bad(msg) {
  console.error(`✗ env: ${msg}`);
  failed = true;
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
console.log("✓ env: no malformed environment variables detected");
