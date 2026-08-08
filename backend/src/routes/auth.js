import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/signup  — replaces supabase.auth.signUp()
authRouter.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ email: email.toLowerCase(), passwordHash });

    const token = signToken(user);
    res.status(201).json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Sign up failed.' });
  }
});

// POST /api/auth/login  — replaces supabase.auth.signInWithPassword()
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await AuditLog.create({
      userId: user._id,
      action: 'login',
      entityType: 'auth',
      entityId: user._id.toString(),
      details: { email: user.email },
    });

    const token = signToken(user);
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// POST /api/auth/logout — replaces supabase.auth.signOut(); mostly for the audit log,
// since JWTs are stateless and the frontend just discards the token.
authRouter.post('/logout', requireAuth, async (req, res) => {
  try {
    await AuditLog.create({
      userId: req.user.id,
      action: 'logout',
      entityType: 'auth',
      entityId: req.user.id,
      details: null,
    });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message || 'Logout failed.' });
  }
});

// GET /api/auth/me — replaces supabase.auth.getSession()
authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: { id: user._id, email: user.email } });
});
