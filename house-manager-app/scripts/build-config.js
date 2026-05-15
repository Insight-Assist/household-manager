/**
 * Generates config.js at deploy time from Netlify environment variables.
 *
 * This runs automatically before each Netlify build (see netlify.toml).
 * Locally, you create config.js by hand — see config.example.js.
 */
const fs = require('fs');
const path = require('path');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_ANON_KEY env var not set.');
  console.warn('   The deployed site will load but Supabase features will be disabled.');
  console.warn('   Set these in Netlify → Site configuration → Environment variables.');
}

const out = `/* AUTO-GENERATED at build time. Do not edit. */
window.APP_CONFIG = {
  SUPABASE_URL: ${JSON.stringify(url || 'YOUR_SUPABASE_PROJECT_URL')},
  SUPABASE_ANON_KEY: ${JSON.stringify(key || 'YOUR_SUPABASE_ANON_KEY')}
};
`;

const outPath = path.join(__dirname, '..', 'config.js');
fs.writeFileSync(outPath, out, 'utf8');
console.log('✅ Wrote config.js');
