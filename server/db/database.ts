/**
 * Application state store.
 *
 * State lives in memory and is written to `data/db.json` on every change, then
 * mirrored to MongoDB Atlas and (when configured) Supabase in the background.
 * On boot the local file is read first, then replaced by the remote copy if one exists.
 */
import fs from 'fs';
import path from 'path';
import { User, Case, Hearing, EmailLog } from '../../src/types';
import { config } from '../config';
import { REAL_ECOURTS_CASES } from './realCasesData';
import { MOCK_USERS, DEFAULT_HEARINGS } from './seedData';
import { COURT_STATE_TABLE_SQL, getMongoDb, getPgPool, getSupabaseClient, withTimeout } from './remoteStores';
import { hashPassword, isPasswordHash } from '../security/passwords';

const DB_DIR = config.dataDir;
const DB_FILE = path.join(DB_DIR, 'db.json');
// Read-only copy shipped with the deployment, used to seed an empty data directory
const SEED_FILE = path.join(config.bundledDataDir, 'db.json');

interface DBStructure {
  users: User[];
  userPasswords: Record<string, string>; // userId -> password
  trackedCaseIds: Record<string, string[]>; // userId -> caseIds[]
  globalCases: Case[]; // E-Court database available for search
  hearings: Hearing[];
  emailLogs: EmailLog[];
  // Keys from retired features (e.g. property notices) are kept so stored data round-trips untouched
  [legacyKey: string]: unknown;
}

type SyncStatus = 'connected' | 'disconnected' | 'error';

class CaseDatabase {
  private data: DBStructure = {
    users: [],
    userPasswords: {},
    trackedCaseIds: {},
    globalCases: [...REAL_ECOURTS_CASES],
    hearings: [],
    emailLogs: []
  };

  private supabaseStatus: SyncStatus = 'disconnected';
  private supabaseError: string | null = null;

  private remoteSyncRunning = false;
  private remoteSyncQueued = false;
  private passwordsMigrated = false;
  private portalAccountsAdded = false;

  /** Settles once stored state has been loaded (local file, then MongoDB / Supabase). */
  public readonly ready: Promise<void>;

  constructor() {
    this.ready = this.initDb().catch(e => console.error('[db] Initial load failed:', e));
  }

  // ==========================================
  // Supabase status & sync
  // ==========================================

  public getSupabaseStatus() {
    const pool = getPgPool();
    const client = getSupabaseClient();
    const isConfigured = !!pool || !!client;
    const mode = pool ? 'direct_postgres' : client ? 'rest_api' : 'none';

    return {
      configured: isConfigured,
      mode,
      url: config.supabaseDisplayUrl,
      status: {
        status: !isConfigured ? 'disconnected' : this.supabaseStatus,
        error: !isConfigured ? 'Neither DATABASE_URL nor SUPABASE_KEY is set in environment secrets.' : this.supabaseError,
        url: config.supabaseDisplayUrl,
        mode
      },
      sql: COURT_STATE_TABLE_SQL
    };
  }

  public async retrySupabaseSync() {
    if (!getPgPool() && !getSupabaseClient()) {
      this.supabaseStatus = 'disconnected';
      this.supabaseError = 'Supabase credentials (DATABASE_URL or SUPABASE_KEY) are not configured in your environment.';
      return this.getSupabaseStatus();
    }
    console.log("Retrying Supabase sync manually...");
    await this.loadFromSupabase(6000);
    return this.getSupabaseStatus();
  }

  /**
   * Pulls the shared state row from Supabase (direct Postgres preferred, REST otherwise).
   * Seeds the row from local state when it does not exist yet.
   */
  private async loadFromSupabase(restTimeoutMs: number) {
    const pool = getPgPool();
    if (pool) {
      this.supabaseStatus = 'connected';
      this.supabaseError = null;
      try {
        await pool.query(COURT_STATE_TABLE_SQL);
        const res = await pool.query(`SELECT data FROM public.court_state WHERE id = 'current' LIMIT 1;`);
        if (res.rows.length === 0) {
          console.log("No data row found in Supabase Direct Postgres. Auto-seeding initial database...");
          this.ensureRealCasesAndTracked();
          await this.saveToSupabase();
        } else if (res.rows[0]?.data) {
          const row = res.rows[0].data;
          this.data = typeof row === 'string' ? JSON.parse(row) : row;
          this.ensureRealCasesAndTracked();
          this.saveLocally();
          console.log("Successfully fetched legal database state via Supabase Direct PostgreSQL!");
        }
        this.supabaseStatus = 'connected';
        this.supabaseError = null;
      } catch (e: any) {
        console.warn("Supabase Direct PostgreSQL sync error:", e?.message || e);
        this.supabaseStatus = 'error';
        this.supabaseError = e?.message || String(e);
      }
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      console.log("Neither DATABASE_URL nor SUPABASE_KEY is configured. Falling back to local db.json storage.");
      this.supabaseStatus = 'disconnected';
      return;
    }

    this.supabaseStatus = 'connected';
    this.supabaseError = null;
    try {
      const { data: row, error }: any = await withTimeout(
        client.from('court_state').select('data').eq('id', 'current').single(),
        restTimeoutMs,
        `Supabase request timed out after ${restTimeoutMs / 1000} seconds. Check network or API key.`
      );

      if (error) {
        if (error.code !== 'PGRST116') throw error;
        console.log("No data row found in Supabase 'court_state' table yet. Saving initial database...");
        this.ensureRealCasesAndTracked();
        await this.saveToSupabase();
      } else if (row && row.data) {
        this.data = row.data;
        this.ensureRealCasesAndTracked();
        this.saveLocally();
        console.log("Successfully fetched and synced legal database state from Supabase Cloud!");
      }
      this.supabaseStatus = 'connected';
      this.supabaseError = null;
    } catch (e: any) {
      console.warn("Supabase cloud sync notice:", e?.message || e);
      this.supabaseStatus = 'error';
      this.supabaseError = e?.message || String(e);
    }
  }

  // ==========================================
  // Boot & seeding
  // ==========================================

  private async initDb() {
    // 1. Boot immediately from local cached file first
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      const source = fs.existsSync(DB_FILE) ? DB_FILE : (fs.existsSync(SEED_FILE) ? SEED_FILE : '');
      const fileContent = source ? fs.readFileSync(source, 'utf-8').trim() : '';
      if (fileContent) {
        this.data = { ...this.data, ...JSON.parse(fileContent) };
        this.ensureRealCasesAndTracked();
      } else {
        this.createMockUsers();
        this.ensureRealCasesAndTracked();
        this.saveLocally();
      }
    } catch (e) {
      console.warn("Could not read local DB, running on fallback in-memory state.", e);
      this.createMockUsers();
      this.ensureRealCasesAndTracked();
    }

    // 2. Load from MongoDB Atlas
    try {
      const mongo = await getMongoDb();
      if (mongo) {
        const doc = await mongo.collection('court_state').findOne({ id: 'current' });
        if (doc && doc.data) {
          this.data = typeof doc.data === 'string' ? JSON.parse(doc.data) : doc.data;
          this.ensureRealCasesAndTracked();
          this.saveLocally();
          console.log(`Successfully loaded application state from MongoDB Atlas (${config.mongoDbName})!`);
        } else {
          console.log("No state found in MongoDB Atlas yet. Seeding initial state...");
          this.ensureRealCasesAndTracked();
          await this.saveToMongo();
        }
      }
    } catch (e) {
      console.warn("MongoDB initial fetch warning:", e);
    }

    // 3. Load from Supabase via Direct PostgreSQL or REST Client
    await this.loadFromSupabase(5000);

    // Replace plaintext passwords in the remote copies too
    if (this.passwordsMigrated) console.log("[db] Migrated stored passwords to scrypt hashes.");
    if (this.portalAccountsAdded) console.log("[db] Added new portal accounts.");
    if (this.passwordsMigrated || this.portalAccountsAdded) {
      this.passwordsMigrated = false;
      this.portalAccountsAdded = false;
      this.save();
    }
  }

  /** Makes sure the verified real cases, the portal accounts and seeded hearings are present. */
  private ensureRealCasesAndTracked() {
    if (!this.data.users) this.data.users = [];
    if (!this.data.userPasswords) this.data.userPasswords = {};
    if (!this.data.emailLogs) this.data.emailLogs = [];

    // 1. Ensure globalCases contains all genuine real cases
    if (!this.data.globalCases || this.data.globalCases.length === 0) {
      this.data.globalCases = [...REAL_ECOURTS_CASES];
    } else {
      for (const rc of REAL_ECOURTS_CASES) {
        const existingIdx = this.data.globalCases.findIndex(c => c.id === rc.id || c.cnrNumber === rc.cnrNumber);
        if (existingIdx === -1) {
          this.data.globalCases.push(rc);
        } else {
          // Keep enriched details
          this.data.globalCases[existingIdx] = { ...rc, ...this.data.globalCases[existingIdx] };
        }
      }
    }

    // 2. Ensure tracking lists exist
    if (!this.data.trackedCaseIds) {
      this.data.trackedCaseIds = {};
    }
    for (const { user } of MOCK_USERS) {
      if (!this.data.trackedCaseIds[user.id]) {
        this.data.trackedCaseIds[user.id] = [];
      }
    }

    // 3. Ensure the portal accounts exist, without overwriting profile edits or a changed password
    for (const account of config.portalAccounts) {
      let accountUser = this.data.users.find(u => u.email.toLowerCase() === account.email);
      if (!accountUser) {
        accountUser = {
          id: account.id,
          email: account.email,
          name: account.name,
          role: account.role,
          phone: account.phone,
          profession: account.profession,
          address: account.address,
          firmName: account.firmName
        };
        this.data.users.push(accountUser);
        this.portalAccountsAdded = true;
      } else {
        accountUser.phone = accountUser.phone || account.phone;
        accountUser.address = accountUser.address || account.address;
      }
      if (!this.data.userPasswords[accountUser.id]) {
        this.data.userPasswords[accountUser.id] = hashPassword(account.initialPassword);
        this.portalAccountsAdded = true;
      }
      if (!this.data.trackedCaseIds[accountUser.id]) {
        this.data.trackedCaseIds[accountUser.id] = [];
      }
    }

    // Older databases stored plaintext passwords; replace them with hashes
    for (const [userId, stored] of Object.entries(this.data.userPasswords)) {
      if (stored && !isPasswordHash(stored)) {
        this.data.userPasswords[userId] = hashPassword(stored);
        this.passwordsMigrated = true;
      }
    }
    // 4. Ensure authentic scheduled hearings exist
    if (!this.data.hearings || this.data.hearings.length === 0) {
      this.data.hearings = DEFAULT_HEARINGS.map(h => ({ ...h }));
    }
  }

  private createMockUsers() {
    for (const { user, password } of MOCK_USERS) {
      this.data.users.push({ ...user });
      this.data.userPasswords[user.id] = hashPassword(password);
      this.data.trackedCaseIds[user.id] = [];
    }
    this.data.emailLogs = [];
  }

  // ==========================================
  // Persistence
  // ==========================================

  private saveLocally() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error("Error writing to local DB", e);
    }
  }

  private async saveToSupabase() {
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(COURT_STATE_TABLE_SQL);
        await pool.query(
          `INSERT INTO public.court_state (id, data, updated_at)
           VALUES ('current', $1, NOW())
           ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
          [JSON.stringify(this.data)]
        );
        this.supabaseStatus = 'connected';
        this.supabaseError = null;
        console.log("Successfully saved database to Supabase via Direct PostgreSQL Connection!");
      } catch (e: any) {
        console.warn("Direct PostgreSQL save notice:", e?.message || e);
        this.supabaseStatus = 'error';
        this.supabaseError = e?.message || String(e);
      }
      return;
    }

    const client = getSupabaseClient();
    if (!client) return;
    try {
      const { error } = await client
        .from('court_state')
        .upsert({ id: 'current', data: this.data, updated_at: new Date().toISOString() });
      if (error) {
        console.warn("Supabase Sync Notice (RLS policy may be active):", error.message);
        this.supabaseStatus = 'error';
        this.supabaseError = error.message;
      } else {
        this.supabaseStatus = 'connected';
        this.supabaseError = null;
        console.log("Successfully saved database to Supabase 'court_state' table.");
      }
    } catch (e: any) {
      console.warn("Supabase Sync Notice:", e?.message || e);
      this.supabaseStatus = 'error';
      this.supabaseError = e?.message || String(e);
    }
  }

  /** Mirrors the state document plus per-user and per-case documents to MongoDB Atlas. */
  public async saveToMongo() {
    try {
      const mongo = await getMongoDb();
      if (!mongo) return;

      const now = new Date();
      const upsertById = <T extends { id: string }>(docs: T[]) =>
        docs.map(doc => ({ updateOne: { filter: { id: doc.id }, update: { $set: doc }, upsert: true } }));

      const stateUpdate = { $set: { data: this.data, updated_at: now } };

      // Only password hashes leave the server; the legacy plaintext field is removed
      const userOps = this.data.users.map(u => ({
        updateOne: {
          filter: { id: u.id },
          update: {
            $set: {
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              phone: u.phone,
              address: u.address,
              firmName: u.firmName,
              profession: u.profession,
              passwordHash: this.data.userPasswords[u.id] || null,
              updatedAt: now
            },
            $unset: { password: '' }
          },
          upsert: true
        }
      }));

      const trackersByCase = new Map<string, string[]>();
      for (const [uid, caseIds] of Object.entries(this.data.trackedCaseIds)) {
        for (const cid of caseIds || []) {
          trackersByCase.set(cid, [...(trackersByCase.get(cid) || []), uid]);
        }
      }
      const caseDocs = this.data.globalCases.map(c => ({
        ...c,
        isTrackedOnDashboard: trackersByCase.has(c.id),
        trackedByUserIds: trackersByCase.get(c.id) || [],
        updatedAt: now
      }));
      const dashboardDocs = caseDocs.filter(c => c.isTrackedOnDashboard);

      const writes: Promise<unknown>[] = [
        mongo.collection('court_state').updateOne({ id: 'current' }, stateUpdate, { upsert: true }),
        mongo.collection('spring_inventory_state').updateOne({ id: 'current' }, stateUpdate, { upsert: true })
      ];
      if (userOps.length > 0) {
        writes.push(mongo.collection('users').bulkWrite(userOps));
        writes.push(mongo.collection('spring_inventory_users').bulkWrite(userOps));
      }
      if (caseDocs.length > 0) {
        writes.push(mongo.collection('cases').bulkWrite(upsertById(caseDocs)));
        writes.push(mongo.collection('spring_inventory_cases').bulkWrite(upsertById(caseDocs)));
      }
      if (dashboardDocs.length > 0) {
        writes.push(mongo.collection('dashboard_cases').bulkWrite(upsertById(dashboardDocs)));
      }
      await Promise.all(writes);

      console.log(`[MongoDB] Synced state, users, and cases to MongoDB Atlas successfully!`);
    } catch (e) {
      console.warn("Async save to MongoDB warning:", e);
    }
  }

  /**
   * Pushes state to the remote stores in the background. Calls made while a push is
   * in flight are coalesced into a single follow-up push of the latest state.
   */
  private scheduleRemoteSync() {
    if (this.remoteSyncRunning) {
      this.remoteSyncQueued = true;
      return;
    }
    this.remoteSyncRunning = true;
    (async () => {
      try {
        if (getPgPool() || getSupabaseClient()) {
          await this.saveToSupabase();
        }
        await this.saveToMongo();
      } finally {
        this.remoteSyncRunning = false;
        if (this.remoteSyncQueued) {
          this.remoteSyncQueued = false;
          this.scheduleRemoteSync();
        }
      }
    })();
  }

  private save() {
    this.saveLocally();
    this.scheduleRemoteSync();
  }

  /** Waits for any in-flight remote sync (used on shutdown). */
  public async flush(timeoutMs = 10000) {
    const deadline = Date.now() + timeoutMs;
    while ((this.remoteSyncRunning || this.remoteSyncQueued) && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // ==========================================
  // Users
  // ==========================================

  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getPasswordForUser(userId: string): string | undefined {
    return this.data.userPasswords[userId];
  }

  setPasswordForUser(userId: string, passwordStr: string) {
    this.data.userPasswords[userId] = passwordStr;
    this.save();
  }

  updateUser(user: User): User {
    const idx = this.data.users.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...user };
    } else {
      this.data.users.push(user);
    }
    this.save();
    return user;
  }

  createUser(user: User, passwordStr: string): User {
    this.data.users.push(user);
    this.data.userPasswords[user.id] = passwordStr;
    if (!this.data.trackedCaseIds[user.id]) {
      this.data.trackedCaseIds[user.id] = [];
    }
    this.save();
    return user;
  }

  // ==========================================
  // Case tracking
  // ==========================================

  getTrackedCaseIds(userId: string): string[] {
    return this.data.trackedCaseIds[userId] || [];
  }

  trackCase(userId: string, caseId: string) {
    if (!this.data.trackedCaseIds[userId]) {
      this.data.trackedCaseIds[userId] = [];
    }
    if (!this.data.trackedCaseIds[userId].includes(caseId)) {
      this.data.trackedCaseIds[userId].push(caseId);
      this.save();
    }
  }

  untrackCase(userId: string, caseId: string) {
    // Remove from every user's tracked list, not just the requester's
    for (const uid of Object.keys(this.data.trackedCaseIds)) {
      this.data.trackedCaseIds[uid] = this.data.trackedCaseIds[uid].filter(id => id !== caseId);
    }
    // Permanently remove case from global cases database so it never reappears on refresh
    if (this.data.globalCases) {
      this.data.globalCases = this.data.globalCases.filter(c => c.id !== caseId);
    }
    this.save();
  }

  getTrackingUsersForCase(caseId: string): User[] {
    return this.data.users.filter(u => this.getTrackedCaseIds(u.id).includes(caseId));
  }

  // ==========================================
  // Cases
  // ==========================================

  getGlobalCases(): Case[] {
    return this.data.globalCases;
  }

  getCaseById(id: string): Case | undefined {
    return this.data.globalCases.find(c => c.id === id);
  }

  addGlobalCase(c: Case) {
    this.data.globalCases.push(c);
    this.save();
  }

  updateCase(updatedCase: Case) {
    const idx = this.data.globalCases.findIndex(c => c.id === updatedCase.id);
    if (idx !== -1) {
      this.data.globalCases[idx] = updatedCase;
      this.save();
    }
  }

  // ==========================================
  // Hearings
  // ==========================================

  getHearings(): Hearing[] {
    return this.data.hearings;
  }

  addHearing(hearing: Hearing) {
    this.data.hearings.push(hearing);
    this.save();
  }

  updateHearing(updatedHearing: Hearing) {
    const idx = this.data.hearings.findIndex(h => h.id === updatedHearing.id);
    if (idx !== -1) {
      this.data.hearings[idx] = updatedHearing;
      this.save();
    }
  }

  // ==========================================
  // Email logs
  // ==========================================

  getEmailLogs(): EmailLog[] {
    return this.data.emailLogs;
  }

  addEmailLog(log: EmailLog) {
    this.data.emailLogs.unshift(log); // newest first
    this.save();
  }
}

export const db = new CaseDatabase();
