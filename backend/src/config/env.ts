// src/config/env.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Define a schema for env variables using zod
const envSchema = z.object({
  PORT: z.string().optional(), // will parse as number later
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  CLIENT_URL: z.string().optional(), // comma-separated URLs
});

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

// Convert values to proper types
export const PORT = Number(parsedEnv.data.PORT || 5000);
export const MONGO_URI = parsedEnv.data.MONGO_URI;
export const JWT_SECRET = parsedEnv.data.JWT_SECRET;

// CLIENT_URL as array of strings
export const CLIENT_URL = parsedEnv.data.CLIENT_URL
  ? parsedEnv.data.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000', 'http://localhost:8080'];
