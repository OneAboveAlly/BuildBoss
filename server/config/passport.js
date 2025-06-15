const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('./database');

// Konfiguracja Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Sprawdź czy użytkownik już istnieje
    let user = await prisma.user.findUnique({
      where: { googleId: profile.id }
    });

    if (user) {
      // Użytkownik istnieje - zaloguj
      return done(null, user);
    }

    // Sprawdź czy istnieje użytkownik z tym emailem
    const existingEmailUser = await prisma.user.findUnique({
      where: { email: profile.emails[0].value.toLowerCase() }
    });

    if (existingEmailUser) {
      // Połącz konto Google z istniejącym kontem
      user = await prisma.user.update({
        where: { id: existingEmailUser.id },
        data: {
          googleId: profile.id,
          isEmailConfirmed: true, // Google email jest już zweryfikowany
          firstName: existingEmailUser.firstName || profile.name.givenName,
          lastName: existingEmailUser.lastName || profile.name.familyName,
          avatar: existingEmailUser.avatar || profile.photos[0]?.value
        }
      });
    } else {
      // Utwórz nowego użytkownika
      user = await prisma.user.create({
        data: {
          email: profile.emails[0].value.toLowerCase(),
          googleId: profile.id,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          avatar: profile.photos[0]?.value,
          isEmailConfirmed: true, // Google email jest już zweryfikowany
          role: 'WORKER'
        }
      });
    }

    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

// Serializacja użytkownika dla sesji
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializacja użytkownika z sesji
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailConfirmed: true,
        avatar: true
      }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport; 