const mode = process.argv[2] || "client";

const requiredByMode = {
  client: ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"],
  migrations: [
    "SUPABASE_PROJECT_ID",
    "SUPABASE_DB_PASSWORD",
    "SUPABASE_ACCESS_TOKEN",
  ],
  github: [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
    "SUPABASE_PROJECT_ID",
    "SUPABASE_DB_PASSWORD",
    "SUPABASE_ACCESS_TOKEN",
    "VERCEL_ORG_ID",
    "VERCEL_PROJECT_ID",
    "VERCEL_TOKEN",
  ],
};

if (!requiredByMode[mode]) {
  console.error(`Unknown mode: ${mode}`);
  process.exit(1);
}

const missing = requiredByMode[mode].filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing environment variables for ${mode}:`);
  missing.forEach((key) => console.error(`- ${key}`));
  process.exit(1);
}

console.log(`Environment check passed for ${mode}.`);
