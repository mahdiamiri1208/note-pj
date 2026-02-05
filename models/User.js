// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,}$/;

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },

    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      validate: {
        validator: (v) => USERNAME_REGEX.test(v),
        message:
          "Username must contain only letters, numbers, dots, hyphens, and underscores",
      },
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v) => EMAIL_REGEX.test(v),
        message: "Please enter a valid email address",
      },
    },

    // 🔹 password فقط برای local لازم است
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      required: function () {
        return this.provider === "local";
      },
    },

    // ===============================
    // ✅ OAuth fields (NEW)
    // ===============================

    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },

    providerId: {
      type: String,
      default: null, // google sub / github id
    },

    hasPassword: {
      type: Boolean,
      default: true, // google users => false
    },
  },
  {
    timestamps: true,
  }
);

// ===============================
// 🔐 Hash password if exists & changed
// ===============================
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  // اگر کاربر oauth بود و پسورد ندارد
  if (!this.password) return;

  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
  this.hasPassword = true;
});

// ===============================
// 🔐 Password comparison helper
// ===============================
UserSchema.methods.comparePassword = function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
