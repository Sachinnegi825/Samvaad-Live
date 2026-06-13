import User from '../models/User.js';

// -----------------------------------------------------------------------
// SEARCH USERS
// GET /api/users/search?q=john
// Lets the logged-in user search for other users to start a chat with
// -----------------------------------------------------------------------
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    // Search by username using a case-insensitive regex
    // $ne (not equal) ensures the logged-in user doesn't see themselves
    const users = await User.find({
      username: { $regex: q.trim(), $options: 'i' },
      _id: { $ne: req.user._id },
    }).select('username avatar isOnline lastSeen').limit(10);

    res.status(200).json({ users });
  } catch (error) {
    console.error('[User] searchUsers error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
