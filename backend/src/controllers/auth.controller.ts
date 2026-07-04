import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/user.model';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { JWT_REFRESH_COOKIE_EXPIRY } from '../config/constants';
import { AuthRequest } from '../middlewares/auth.middleware';

class AuthController {
  /**
   * Register a new user
   */
  public async signup(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ message: 'Please provide all required fields.' });
        return;
      }

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ message: 'User with this email already exists.' });
        return;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const user = await User.create({
        name,
        email,
        passwordHash,
      });

      // Generate tokens
      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken(user._id.toString());

      // Save refresh token
      user.refreshToken = refreshToken;
      await user.save();

      // Set cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: JWT_REFRESH_COOKIE_EXPIRY,
      });

      res.status(201).json({
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Log in an existing user
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: 'Please provide email and password.' });
        return;
      }

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        res.status(400).json({ message: 'Invalid credentials.' });
        return;
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ message: 'Invalid credentials.' });
        return;
      }

      // Generate tokens
      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken(user._id.toString());

      // Save refresh token
      user.refreshToken = refreshToken;
      await user.save();

      // Set cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: JWT_REFRESH_COOKIE_EXPIRY,
      });

      res.status(200).json({
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Rotate access & refresh tokens
   */
  public async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!refreshToken) {
        res.status(401).json({ message: 'Refresh token missing.' });
        return;
      }

      // Verify token
      let payload;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch (err) {
        res.status(403).json({ message: 'Invalid or expired refresh token.' });
        return;
      }

      // Find user
      const user = await User.findById(payload.userId);
      if (!user || user.refreshToken !== refreshToken) {
        res.status(403).json({ message: 'Invalid refresh token mapping.' });
        return;
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken(user._id.toString());
      const newRefreshToken = generateRefreshToken(user._id.toString());

      // Save new refresh token
      user.refreshToken = newRefreshToken;
      await user.save();

      // Set cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: JWT_REFRESH_COOKIE_EXPIRY,
      });

      res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Log out and invalidate current refresh token
   */
  public async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (refreshToken) {
        const payload = verifyRefreshToken(refreshToken);
        const user = await User.findById(payload.userId);
        if (user) {
          user.refreshToken = undefined;
          await user.save();
        }
      }

      res.clearCookie('refreshToken');
      res.status(200).json({ message: 'Logged out successfully.' });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Fetch authenticated user details
   */
  public async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const user = await User.findById(userId).select('-passwordHash -refreshToken');
      if (!user) {
        res.status(404).json({ message: 'User not found.' });
        return;
      }

      const userObj = user.toObject();
      if (userObj.storageConfig) {
        if (userObj.storageConfig.accessKeyId) {
          userObj.storageConfig.accessKeyId = userObj.storageConfig.accessKeyId.slice(-4).padStart(16, '•');
        }
        if (userObj.storageConfig.secretAccessKey) {
          userObj.storageConfig.secretAccessKey = '••••••••••••••••';
        }
      }

      res.status(200).json(userObj);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Update user settings (profile, password, storage configurations)
   */
  public async updateUserSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { name, currentPassword, newPassword, storageConfig } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: 'User not found.' });
        return;
      }

      // 1. Profile Update
      if (name) {
        user.name = name;
      }

      // 2. Password Change
      if (currentPassword && newPassword) {
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
          res.status(400).json({ message: 'Current password incorrect.' });
          return;
        }
        if (newPassword.length < 6) {
          res.status(400).json({ message: 'New password must be at least 6 characters.' });
          return;
        }
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);
      }

      // 3. Storage Config Update
      if (storageConfig !== undefined) {
        if (!storageConfig || (!storageConfig.accessKeyId && !storageConfig.secretAccessKey && !storageConfig.bucketName && !storageConfig.endpoint)) {
          user.storageConfig = undefined;
        } else {
          const originalConfig = user.storageConfig || {};
          const accessKeyId = storageConfig.accessKeyId?.startsWith('•') 
            ? originalConfig.accessKeyId 
            : storageConfig.accessKeyId;
          const secretAccessKey = storageConfig.secretAccessKey?.startsWith('•') 
            ? originalConfig.secretAccessKey 
            : storageConfig.secretAccessKey;

          user.storageConfig = {
            accessKeyId: accessKeyId || '',
            secretAccessKey: secretAccessKey || '',
            bucketName: storageConfig.bucketName || '',
            endpoint: storageConfig.endpoint || '',
          };
        }
      }

      await user.save();

      const userObj = user.toObject() as any;
      delete userObj.passwordHash;
      delete userObj.refreshToken;

      if (userObj.storageConfig) {
        if (userObj.storageConfig.accessKeyId) {
          userObj.storageConfig.accessKeyId = userObj.storageConfig.accessKeyId.slice(-4).padStart(16, '•');
        }
        if (userObj.storageConfig.secretAccessKey) {
          userObj.storageConfig.secretAccessKey = '••••••••••••••••';
        }
      }

      res.status(200).json({
        message: 'Settings updated successfully.',
        user: userObj,
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }
}

export default new AuthController();
