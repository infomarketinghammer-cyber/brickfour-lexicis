import { db } from '../db/database';
import { config } from '../config';
import { User } from '../../src/types';
import { createRouter } from '../http';
import { hashPassword, verifyPassword } from '../security/passwords';
import { createSessionToken } from '../security/sessions';
import { rateLimit } from '../security/middleware';

/** Routes reachable without a session. */
export const publicAuthRoutes = createRouter();
/** Routes for the signed-in user (mounted behind requireAuth). */
export const accountRoutes = createRouter();

const portalEmails = new Set(config.portalAccounts.map(account => account.email));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many sign-in attempts. Please wait 15 minutes and try again."
});

function toPublicUser(user: User): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    profession: user.profession,
    address: user.address,
    firmName: user.firmName
  };
}

function issueSession(user: User) {
  return createSessionToken(user.id, db.getPasswordForUser(user.id));
}

// Auth API: Login (restricted to the authorised portal accounts)
publicAuthRoutes.post('/auth/login', loginLimiter, (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = portalEmails.has(normalizedEmail) ? db.getUserByEmail(normalizedEmail) : undefined;
  if (!user || !verifyPassword(password, db.getPasswordForUser(user.id))) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const { token, expiresAt } = issueSession(user);
  res.json({ success: true, user: toPublicUser(user), token, expiresAt });
});

// Auth API: Register
publicAuthRoutes.post('/auth/register', (req, res) => {
  return res.status(403).json({ error: "Self-registration is disabled. Access is restricted to authorized personnel only." });
});

// Current session's user (used to validate a restored session)
accountRoutes.get('/auth/me', (req, res) => {
  res.json({ user: toPublicUser(req.user!) });
});

// User API: Update Profile
accountRoutes.post('/user/update', async (req, res) => {
  const { name, phone, address, firmName, profession } = req.body || {};
  const user = req.user!;
  if (name) user.name = String(name);
  if (phone) user.phone = String(phone);
  if (address) user.address = String(address);
  if (firmName) user.firmName = String(firmName);
  if (profession) user.profession = String(profession);

  db.updateUser(user);
  res.json({ success: true, user: toPublicUser(user) });
});

// User API: Update Password (returns a fresh session; older sessions stop working)
accountRoutes.post('/user/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const user = req.user!;
  if (typeof currentPassword !== 'string' || !verifyPassword(currentPassword, db.getPasswordForUser(user.id))) {
    return res.status(400).json({ error: "Current password is incorrect" });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }
  db.setPasswordForUser(user.id, hashPassword(newPassword));

  const { token, expiresAt } = issueSession(user);
  res.json({ success: true, message: "Password updated successfully", token, expiresAt });
});
