const express = require('express');
const router = express.Router();
const Joi = require('joi');
const prisma = require('../config/database');
const { generateToken } = require('../config/jwt');
const { hashPassword, comparePassword, generateRandomToken } = require('../utils/password');
const { sendConfirmationEmail } = require('../utils/email');
const { authenticateToken } = require('../middleware/auth');
const { validate, validateParams } = require('../middleware/validation');
const { logger, securityLogger } = require('../config/logger');
const { 
  registerSchema, 
  loginSchema, 
  resetPasswordSchema, 
  newPasswordSchema, 
  confirmEmailSchema 
} = require('../schemas/authSchemas');
const { idSchema } = require('../schemas/commonSchemas');
const passport = require('../config/passport');

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Sprawdź czy użytkownik już istnieje
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Użytkownik z tym adresem email już istnieje'
      });
    }

    // Hashuj hasło
    const hashedPassword = await hashPassword(password);
    
    // Generuj token potwierdzenia
    const confirmationToken = generateRandomToken();

    // Utwórz użytkownika
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        confirmationToken,
        role: 'WORKER' // Domyślna rola
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailConfirmed: true,
        createdAt: true
      }
    });

    // Wyślij email potwierdzający
    const emailResult = await sendConfirmationEmail(user.email, confirmationToken);
    
    if (!emailResult.success) {
      logger.warn('Failed to send confirmation email', {
        email: user.email,
        error: emailResult.error,
        userId: user.id
      });
    }

    // Generuj JWT token
    const token = generateToken({ userId: user.id });

    // Log successful registration
    securityLogger.logAuthAttempt(user.email, true, req.ip, req.get('User-Agent'));
    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      emailConfirmed: user.isEmailConfirmed
    });

    res.status(201).json({
      success: true,
      message: 'Konto zostało utworzone. Sprawdź email aby potwierdzić adres.',
      data: {
        user,
        token,
        emailSent: emailResult.success
      }
    });

  } catch (error) {
    logger.error('Registration error', {
      error: error.message,
      stack: error.stack,
      email: req.body?.email
    });
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas rejestracji'
    });
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Znajdź użytkownika
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailConfirmed: true,
        avatar: true,
        createdAt: true
      }
    });

    if (!user) {
      // Log failed login attempt
      securityLogger.logAuthAttempt(email, false, req.ip, req.get('User-Agent'));
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowy email lub hasło'
      });
    }

    // Sprawdź hasło
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      // Log failed login attempt
      securityLogger.logAuthAttempt(email, false, req.ip, req.get('User-Agent'));
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowy email lub hasło'
      });
    }

    // Generuj JWT token
    const token = generateToken({ userId: user.id });

    // Usuń hasło z odpowiedzi
    const { password: _, ...userWithoutPassword } = user;

    // Log successful login
    securityLogger.logAuthAttempt(user.email, true, req.ip, req.get('User-Agent'));
    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Logowanie pomyślne',
      data: {
        user: userWithoutPassword,
        token
      }
    });

  } catch (error) {
    logger.error('Login error', {
      error: error.message,
      stack: error.stack,
      email: req.body?.email
    });
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas logowania'
    });
  }
});

// GET /api/auth/confirm/:token
router.get('/confirm/:token', validateParams(Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Token potwierdzenia jest wymagany'
  })
})), async (req, res) => {
  try {
    const { token } = req.params;

    // Znajdź użytkownika z tym tokenem
    const user = await prisma.user.findUnique({
      where: { confirmationToken: token }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Nieprawidłowy lub wygasły token potwierdzenia'
      });
    }

    if (user.isEmailConfirmed) {
      return res.status(400).json({
        success: false,
        message: 'Email został już potwierdzony'
      });
    }

    // Potwierdź email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailConfirmed: true,
        confirmationToken: null
      }
    });

    res.json({
      success: true,
      message: 'Email został pomyślnie potwierdzony'
    });

  } catch (error) {
    console.error('Email confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas potwierdzania email'
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Pobierz pełne dane użytkownika z relacjami
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailConfirmed: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        workerProfiles: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            }
          }
        },
        createdCompanies: {
          select: {
            id: true,
            name: true,
            logo: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie znaleziony'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas pobierania profilu'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req, res) => {
  // W przypadku JWT, logout jest po stronie klienta (usunięcie tokena)
  res.json({
    success: true,
    message: 'Wylogowanie pomyślne'
  });
});

// POST /api/auth/resend-confirmation
router.post('/resend-confirmation', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie znaleziony'
      });
    }

    if (user.isEmailConfirmed) {
      return res.status(400).json({
        success: false,
        message: 'Email został już potwierdzony'
      });
    }

    // Generuj nowy token
    const confirmationToken = generateRandomToken();

    await prisma.user.update({
      where: { id: user.id },
      data: { confirmationToken }
    });

    // Wyślij email
    const emailResult = await sendConfirmationEmail(user.email, confirmationToken);

    res.json({
      success: true,
      message: 'Email potwierdzający został wysłany ponownie',
      emailSent: emailResult.success
    });

  } catch (error) {
    console.error('Resend confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas wysyłania email'
    });
  }
});

// POST /api/auth/verify-password - Weryfikacja hasła
router.post('/verify-password', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Hasło jest wymagane'
      });
    }

    // Znajdź użytkownika
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        password: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie został znaleziony'
      });
    }

    // Sprawdź hasło
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowe hasło'
      });
    }

    res.json({
      success: true,
      message: 'Hasło zweryfikowane pomyślnie'
    });

  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas weryfikacji hasła'
    });
  }
});

// Google OAuth Routes
// GET /api/auth/google
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// GET /api/auth/google/callback
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
    session: false 
  }),
  async (req, res) => {
    try {
      // Generuj JWT token dla użytkownika
      const token = generateToken({ userId: req.user.id });
      
      // Przekieruj do frontendu z tokenem
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_callback_failed`);
    }
  }
);

module.exports = router; 