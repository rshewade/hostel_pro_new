import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { phoneNumber } from 'better-auth/plugins';
import { getSmsProvider } from './otp-provider';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    'http://localhost:3002',
    'http://51.68.196.242:3002',
    process.env.BETTER_AUTH_URL || '',
  ].filter(Boolean),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh every 24 hours
  },
  plugins: [
    phoneNumber({
      sendOTP: async ({ phoneNumber: phone, code }) => {
        await getSmsProvider().sendOtp(phone, code);
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
