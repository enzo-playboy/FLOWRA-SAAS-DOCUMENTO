import { Redis } from "@upstash/redis";
import { env, isRedisConfigured } from "./env";

// Cliente Redis (Upstash). Serverless-friendly: não mantém conexão aberta.
// Se não configurado, fica null e o cache/rate-limit caem pra fallback em memória.
export const redis: Redis | null = isRedisConfigured
  ? new Redis({ url: env.redisUrl, token: env.redisToken })
  : null;

export const redisReady = isRedisConfigured;
