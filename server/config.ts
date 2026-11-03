/**
 * Central runtime configuration.
 *
 * Importing this module loads `.env` first, so every service reads the same
 * values regardless of import order. Secrets come only from the environment;
 * see `.env.example` for the full list.
 */
import 'dotenv/config';
import crypto from 'crypto';
import path from 'path';

function parseCliArgs(argv: string[]) {
  const parsed: { port?: number; host?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--port' && argv[i + 1]) {
      parsed.port = parseInt(argv[i + 1], 10);
    }
    if (argv[i] === '--host' && argv[i + 1]) {
      parsed.host = argv[i + 1];
    }
  }
  return parsed;
}

const env = (name: string) => process.env[name]?.trim() || '';

const cli = parseCliArgs(process.argv.slice(2));
const isProduction = process.env.NODE_ENV === 'production';
// Vercel sets VERCEL=1; its functions can only write under /tmp
const isVercel = !!process.env.VERCEL;

/**
 * Secret for signing session tokens. Hosted deployments (e.g. Google AI Studio / Cloud Run)
 * often inject only API keys, so without SESSION_SECRET a stable secret is derived from
 * one of those: every instance and restart then signs and accepts the same tokens.
 */
function resolveSessionSecret(): string {
  const secret = env('SESSION_SECRET');
  if (secret) return secret;

  const seed = env('GEMINI_API_KEY') || env('ECOURT_API_KEY');
  if (seed) {
    console.warn('[config] SESSION_SECRET is not set; deriving the session secret from the configured API key. Set SESSION_SECRET for an independent secret.');
    return crypto.createHmac('sha256', seed).update('lexicis-session-secret-v1').digest('hex');
  }

  console.warn('[config] SESSION_SECRET is not set and no API key is available; using a temporary secret. Users are signed out whenever the server restarts.');
  return crypto.randomBytes(32).toString('hex');
}

export const config = {
  port: cli.port ?? parseInt(process.env.PORT || '3000', 10),
  host: cli.host ?? (env('HOST') || '0.0.0.0'),
  isProduction,
  isVercel,

  /** Writable directory for db.json and caches. Files bundled in ./data seed it when it is elsewhere. */
  dataDir: env('DATA_DIR') || (isVercel ? path.join('/tmp', 'lexicis-data') : path.join(process.cwd(), 'data')),
  bundledDataDir: path.join(process.cwd(), 'data'),

  /** Vercel Cron sends this as a Bearer token to scheduled endpoints */
  cronSecret: env('CRON_SECRET'),
  // Hosted deployments run behind a load balancer; client IPs then come from X-Forwarded-For.
  // Set TRUST_PROXY=0 when serving directly to the internet.
  trustProxy: env('TRUST_PROXY') || (isProduction ? '1' : ''),

  session: {
    secret: resolveSessionSecret(),
    ttlHours: parseInt(env('SESSION_TTL_HOURS') || '12', 10)
  },

  // The authorised portal accounts (self-registration is disabled). initialPassword only
  // seeds an account that doesn't exist yet; the stored (hashed) password is authoritative.
  portalAccounts: [
    {
      id: 'archana-katkar',
      email: 'archana.katkar@brickfour.com',
      initialPassword: env('ADMIN_INITIAL_PASSWORD') || 'Archana@123',
      name: 'Archana Katkar',
      role: 'attorney' as const,
      phone: '8975332899',
      profession: 'Legal Executive',
      address: 'brickfour, Yerwada',
      firmName: 'Brickfour'
    },
    {
      id: 'dwarka',
      email: 'dwarka@brickfour.com',
      initialPassword: 'Dwarka@123',
      name: 'Dwarka',
      role: 'attorney' as const,
      phone: '',
      profession: 'Legal Executive',
      address: 'brickfour, Yerwada',
      firmName: 'Brickfour'
    },
    {
      id: 'vikas-khatik',
      email: 'vikas.khatik@brickfour.com',
      initialPassword: 'Vikas@123',
      name: 'Vikas Khatik',
      role: 'attorney' as const,
      phone: '',
      profession: 'Legal Executive',
      address: 'brickfour, Yerwada',
      firmName: 'Brickfour'
    }
  ],

  geminiApiKey: env('GEMINI_API_KEY'),

  ecourt: {
    baseUrl: env('ECOURT_API_BASE_URL') || 'https://webapi.ecourtsindia.com',
    apiKey: env('ECOURT_API_KEY')
  },

  indianKanoon: {
    baseUrl: env('INDIAN_KANOON_BASE_URL') || 'https://api.indiankanoon.org',
    apiToken: env('INDIAN_KANOON_API_TOKEN')
  },

  mongoUrl: env('MONGODB_URL'),
  mongoDbName: env('MONGODB_DB_NAME') || 'spring_inventory',

  supabaseDisplayUrl: env('SUPABASE_URL') || 'Not configured',

  smtp: {
    host: env('SMTP_HOST'),
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    user: env('SMTP_USER'),
    pass: process.env.SMTP_PASS || ''
  },

  alertEmailRecipient: env('ALERT_EMAIL_RECIPIENT') || 'alerts@localhost',

  // Browser used for PDF rendering; defaults to the Chrome build Puppeteer downloads
  pdfBrowserPath: env('PDF_BROWSER_PATH') || env('PUPPETEER_EXECUTABLE_PATH')
};

/** Logs which optional integrations are active, without revealing any secret. */
export function logConfigSummary() {
  const on = (v: string) => (v ? 'configured' : 'not set');
  console.log(`[config] mode=${isProduction ? 'production' : 'development'} gemini=${on(config.geminiApiKey)} ecourts=${on(config.ecourt.apiKey)} kanoon=${on(config.indianKanoon.apiToken)} mongodb=${on(config.mongoUrl)} smtp=${on(config.smtp.host)}`);
}
