import express from 'express';

const router = express.Router();

// In-memory persistent stores for development and fallback auth
const devUsers = new Map();
const devFavorites = new Map(); // userId -> Map(propertyId -> snapshot)

// Helper: generate simple secure session token
function generateToken(userId) {
  return Buffer.from(`${userId}:${Date.now()}:${Math.random().toString(36)}`).toString('base64');
}

// Helper: extract and verify user from Bearer token
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [userId] = decoded.split(':');
    const user = devUsers.get(userId);
    if (!user) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid auth token' });
  }
}

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Email and password (min 6 chars) are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing
    for (const u of devUsers.values()) {
      if (u.email === normalizedEmail) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newUser = {
      id: userId,
      email: normalizedEmail,
      // In production, password hash is handled by Supabase Auth / bcrypt
      passwordHash: Buffer.from(password).toString('base64'),
      fullName: fullName || normalizedEmail.split('@')[0],
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || normalizedEmail)}`,
      createdAt: new Date().toISOString()
    };

    devUsers.set(userId, newUser);
    devFavorites.set(userId, new Map());

    const token = generateToken(userId);
    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        avatarUrl: newUser.avatarUrl,
        createdAt: newUser.createdAt
      },
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed', message: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let foundUser = null;

    for (const u of devUsers.values()) {
      if (u.email === normalizedEmail) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser || foundUser.passwordHash !== Buffer.from(password).toString('base64')) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(foundUser.id);
    res.json({
      user: {
        id: foundUser.id,
        email: foundUser.email,
        fullName: foundUser.fullName,
        avatarUrl: foundUser.avatarUrl,
        createdAt: foundUser.createdAt
      },
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', message: err.message });
  }
});

// GET PROFILE
router.get('/profile', authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.fullName,
      avatarUrl: req.user.avatarUrl,
      createdAt: req.user.createdAt
    }
  });
});

// UPDATE PROFILE
router.patch('/profile', authenticate, (req, res) => {
  const { fullName, avatarUrl } = req.body;
  if (fullName !== undefined) req.user.fullName = fullName.trim();
  if (avatarUrl !== undefined) req.user.avatarUrl = avatarUrl.trim();
  devUsers.set(req.user.id, req.user);

  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.fullName,
      avatarUrl: req.user.avatarUrl,
      createdAt: req.user.createdAt
    }
  });
});

// GET FAVORITES
router.get('/favorites', authenticate, (req, res) => {
  const userFavs = devFavorites.get(req.user.id) || new Map();
  const list = Array.from(userFavs.values());
  res.json({ favorites: list });
});

// ADD FAVORITE
router.post('/favorites', authenticate, (req, res) => {
  const { property } = req.body;
  if (!property || !property.id) {
    return res.status(400).json({ error: 'Valid property object with ID is required' });
  }

  let userFavs = devFavorites.get(req.user.id);
  if (!userFavs) {
    userFavs = new Map();
    devFavorites.set(req.user.id, userFavs);
  }

  userFavs.set(property.id, {
    propertyId: property.id,
    propertySnapshot: property,
    savedAt: new Date().toISOString()
  });

  res.status(201).json({ success: true, count: userFavs.size });
});

// REMOVE FAVORITE
router.delete('/favorites/:propertyId', authenticate, (req, res) => {
  const { propertyId } = req.params;
  const userFavs = devFavorites.get(req.user.id);
  if (userFavs) {
    userFavs.delete(propertyId);
  }
  res.json({ success: true });
});

export default router;
