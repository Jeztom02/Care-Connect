import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { User, Patient } from './models';
import { signToken } from './auth';

// Configure Google OAuth Strategy
const googleStrategyConfig = {
  clientID: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
};

// Only configure Google strategy if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(googleStrategyConfig, async (accessToken: string, refreshToken: string, profile: Profile, done: (error: any, user?: any) => void) => {
  try {
    const { id, displayName, emails, photos } = profile;
    
    if (!emails || !emails[0]) {
      return done(new Error('No email found in Google profile'), undefined);
    }

    const email = emails[0].value.toLowerCase();
    const profilePicture = photos && photos[0] ? photos[0].value : undefined;

    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: id });
    
    if (user) {
      // Ensure patient doc exists for patient users
      try {
        if (user.role === 'patient') {
          const existingPatient = await Patient.findOne({ userId: user._id });
          if (!existingPatient) {
            const patientDoc = await Patient.create({
              name: user.name,
              email: user.email,
              phone: (user as any).phone,
              userId: user._id,
              status: 'Active'
            });
            // eslint-disable-next-line no-console
            console.log('[GOOGLE][LINK][PATIENT_SYNC] Created patient', { userId: String(user._id), patientId: String(patientDoc._id) });
          } else {
            // eslint-disable-next-line no-console
            console.log('[GOOGLE][LINK][PATIENT_SYNC] Patient already exists for user', { userId: String(user._id) });
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[GOOGLE][LINK][PATIENT_SYNC] Failed to ensure patient', { userId: String(user._id), error: (e as Error).message });
      }
      return done(null, user);
    }

    // Check if user exists with this email (for linking accounts)
    user = await User.findOne({ email });
    
    if (user) {
      // Link Google account to existing user
      user.googleId = id;
      user.profilePicture = profilePicture;
      user.authProvider = 'google';
      await user.save();
      // Ensure patient doc exists for patient users after linking
      try {
        if (user.role === 'patient') {
          const existingPatient = await Patient.findOne({ userId: user._id });
          if (!existingPatient) {
            const patientDoc = await Patient.create({
              name: user.name,
              email: user.email,
              phone: (user as any).phone,
              userId: user._id,
              status: 'Active'
            });
            // eslint-disable-next-line no-console
            console.log('[GOOGLE][LINK_EXISTING][PATIENT_SYNC] Created patient', { userId: String(user._id), patientId: String(patientDoc._id) });
          } else {
            // eslint-disable-next-line no-console
            console.log('[GOOGLE][LINK_EXISTING][PATIENT_SYNC] Patient already exists for user', { userId: String(user._id) });
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[GOOGLE][LINK_EXISTING][PATIENT_SYNC] Failed to ensure patient', { userId: String(user._id), error: (e as Error).message });
      }
      return done(null, user);
    }

    // Create new user with Google OAuth
    // Default role to 'patient' for new Google users - they can be updated by admin later
    user = await User.create({
      email,
      name: displayName,
      googleId: id,
      profilePicture,
      authProvider: 'google',
      role: 'patient' // Default role for Google OAuth users
    });

    // Ensure patient doc exists for newly created Google users with patient role
    try {
      if (user.role === 'patient') {
        const existingPatient = await Patient.findOne({ userId: user._id });
        if (!existingPatient) {
          const patientDoc = await Patient.create({
            name: user.name,
            email: user.email,
            phone: (user as any).phone,
            userId: user._id,
            status: 'Active'
          });
          // eslint-disable-next-line no-console
          console.log('[GOOGLE][CREATE][PATIENT_SYNC] Created patient', { userId: String(user._id), patientId: String(patientDoc._id) });
        } else {
          // eslint-disable-next-line no-console
          console.log('[GOOGLE][CREATE][PATIENT_SYNC] Patient already exists for user', { userId: String(user._id) });
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[GOOGLE][CREATE][PATIENT_SYNC] Failed to create patient', { userId: String(user._id), error: (e as Error).message });
    }

    return done(null, user);
  } catch (error) {
    return done(error, undefined);
  }
}));
} else {
  console.warn('Google OAuth credentials not found. Google sign-in will not be available.');
}

// Serialize user for session
passport.serializeUser((user: any, done: (err: any, id?: any) => void) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done: (err: any, user?: any) => void) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export { passport };
