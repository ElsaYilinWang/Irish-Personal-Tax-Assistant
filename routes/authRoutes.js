const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: process.env.EMAIL_PORT || 2525,
  auth: {
    user: process.env.EMAIL_USER || 'your_mailtrap_user',
    pass: process.env.EMAIL_PASS || 'your_mailtrap_password'
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      username,
      email,
      password: hashedPassword,
      verificationCode,
      verificationCodeExpires: codeExpires
    });

    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email, verificationCode);

    // Create JWT token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          success: true,
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            isVerified: user.isVerified
          },
          message: 'Registration successful. Please check your email for verification code.'
        });
      }
    );
  } catch (error) {
    console.error('Error in user registration:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create JWT token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({
          success: true,
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            isVerified: user.isVerified
          }
        });
      }
    );
  } catch (error) {
    console.error('Error in user login:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify user email with code
// @access  Public
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and verification code'
      });
    }

    const user = await User.findOne({ 
      email,
      verificationCode: code,
      verificationCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Update user to verified status
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification code
// @access  Public
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Create new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = codeExpires;
    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email, verificationCode);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.error('Error resending verification code:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending verification code'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset code
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user.email, resetCode);

    res.status(200).json({
      success: true,
      message: 'Password reset code sent to your email'
    });
  } catch (error) {
    console.error('Error sending password reset:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending password reset'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with code
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, reset code, and new password'
      });
    }

    const user = await User.findOne({ 
      email,
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password
    user.password = hashedPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update username if provided
    if (username) {
      user.username = username;
    }
    
    // Update email if provided and different from current
    if (email && email !== user.email) {
      // Check if email is already in use
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }
      
      // Create verification code for new email
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const codeExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      
      user.newEmail = email;
      user.verificationCode = verificationCode;
      user.verificationCodeExpires = codeExpires;
      user.isVerified = false;
      
      // Send verification email to new address
      await sendVerificationEmail(email, verificationCode);
    }
    
    // Update password if provided
    if (currentPassword && newPassword) {
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        newEmail: user.newEmail,
        isVerified: user.isVerified
      },
      message: email && email !== user.email 
        ? 'Profile updated. Please verify your new email address.'
        : 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// Helper function to send verification email
const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@cainsabhail.ie',
    to: email,
    subject: 'Verify Your Email - CáinSábháil Irish Tax Assistant',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #2c3e50; text-align: center;">CáinSábháil - Irish Tax Assistant</h2>
        <p style="font-size: 16px; line-height: 1.5;">Hello,</p>
        <p style="font-size: 16px; line-height: 1.5;">Thank you for registering with CáinSábháil, your Irish Personal Tax Assistant. To complete your registration, please verify your email address using the verification code below:</p>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <h3 style="font-size: 24px; margin: 0; letter-spacing: 5px;">${code}</h3>
        </div>
        <p style="font-size: 16px; line-height: 1.5;">This code will expire in 30 minutes. If you did not request this verification, please ignore this email.</p>
        <p style="font-size: 16px; line-height: 1.5;">Thank you,<br>The CáinSábháil Team</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Helper function to send password reset email
const sendPasswordResetEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@cainsabhail.ie',
    to: email,
    subject: 'Password Reset - CáinSábháil Irish Tax Assistant',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #2c3e50; text-align: center;">CáinSábháil - Irish Tax Assistant</h2>
        <p style="font-size: 16px; line-height: 1.5;">Hello,</p>
        <p style="font-size: 16px; line-height: 1.5;">We received a request to reset your password. Please use the code below to reset your password:</p>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <h3 style="font-size: 24px; margin: 0; letter-spacing: 5px;">${code}</h3>
        </div>
        <p style="font-size: 16px; line-height: 1.5;">This code will expire in 15 minutes. If you did not request a password reset, please ignore this email.</p>
        <p style="font-size: 16px; line-height: 1.5;">Thank you,<br>The CáinSábháil Team</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = router;
