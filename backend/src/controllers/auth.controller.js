import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Generates a signed JWT token for a given user ID.
 * The token expires in 7 days — after that the user must log in again.
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },                  // Payload: what we store inside the token
    process.env.JWT_SECRET,          // Secret key: used to sign and verify
    { expiresIn: '7d' }              // Expiry
  );
};

// -----------------------------------------------------------------------
// REGISTER
// POST /api/auth/register
// -----------------------------------------------------------------------
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Check if email or username already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({
        message: existingUser.email === email
          ? 'An account with this email already exists'
          : 'This username is already taken',
      });
    }

    // 2. Create the user (password hashing happens in the pre-save hook)
    const user = await User.create({ username, email, password });

    // 3. Generate JWT token
    const token = generateToken(user._id);

    // 4. Return the token and safe user data (no password)
    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('[Auth] Register error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// -----------------------------------------------------------------------
// LOGIN
// POST /api/auth/login
// -----------------------------------------------------------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email — .select('+password') overrides the select:false on the schema
    const user = await User.findOne({ email }).select('+password');


    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 2. Compare the plain text password against the stored bcrypt hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 3. Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('[Auth] Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// -----------------------------------------------------------------------
// GET ME (get current logged-in user from token)
// GET /api/auth/me
// -----------------------------------------------------------------------
export const getMe = async (req, res) => {
  // req.user is attached by the auth middleware after token verification
  res.status(200).json({ user: req.user });
};
