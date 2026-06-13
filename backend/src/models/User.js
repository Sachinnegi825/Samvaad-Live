import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Schema
 * 
 * This defines the "shape" of every user document stored in MongoDB.
 * Mongoose will enforce this schema on every save.
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,           // removes leading/trailing whitespace
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,      // always store emails in lowercase
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,        // NEVER return password in queries by default
    },
    avatar: {
      type: String,
      default: '', // Will hold a Cloudinary URL later (Phase 3)
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // auto-adds createdAt and updatedAt fields
  }
);

/**
 * Pre-save Hook
 * 
 * Runs automatically BEFORE saving a document to MongoDB.
 * We use this to hash the password so we NEVER store it in plain text.
 * bcrypt.hash() is slow by design — it makes brute-force attacks impractical.
 */
userSchema.pre('save', async function () {
  // Only hash if the password field was actually modified (not on every update)
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10); // 10 = cost factor (iterations)
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Instance Method: comparePassword
 * 
 * A helper method we attach to every User document.
 * Compares a plain text password against the stored hash.
 * Usage: const isMatch = await user.comparePassword('mypassword123')
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
