const { verifyToken } = require('../config/jwt');
const { prisma } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token dostępu wymagany'
      });
    }

    const decoded = verifyToken(token);

    // Sprawdź czy użytkownik nadal istnieje
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailConfirmed: true,
        firstName: true,
        lastName: true,
        avatar: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Użytkownik nie istnieje'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({
      success: false,
      message: 'Nieprawidłowy token'
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autoryzacja wymagana'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Brak uprawnień'
      });
    }

    next();
  };
};

const requireEmailConfirmed = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autoryzacja wymagana'
    });
  }

  if (!req.user.isEmailConfirmed) {
    return res.status(403).json({
      success: false,
      message: 'Email nie został potwierdzony'
    });
  }

  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      // Brak tokenu - kontynuuj bez użytkownika
      req.user = null;
      return next();
    }

    const decoded = verifyToken(token);

    // Sprawdź czy użytkownik nadal istnieje
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailConfirmed: true,
        firstName: true,
        lastName: true,
        avatar: true
      }
    });

    req.user = user || null;
    next();
  } catch {
    // Błąd tokenu - kontynuuj bez użytkownika
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireEmailConfirmed,
  optionalAuth
};
