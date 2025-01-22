import { NextFunction, Request, Response } from "express";
import {
    ApiError,
    InternalServerError,
    TooManyRequestsError,
} from "~/managers/ErrorManager";
import redis from "~/managers/RedisManager";

export interface RateLimitOptions {
    windowSize?: number; // Time window in seconds
    maxRequests?: number; // Maximum requests allowed per window
    key_prefix?: string; // Prefix for Redis keys
    write_headers?: boolean;
    error_message?: string; // Custom error message
}

export const RateLimit =
    (opts: RateLimitOptions = {}) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const key_prefix = opts.key_prefix || "rate-limit";
            const windowSize = opts.windowSize || 60;
            const maxRequests = opts.maxRequests || 100;
            const key = `${key_prefix}:${req.ip}`;

            const current = await redis.incr(key);

            if (current === 1) {
                await redis.expire(key, windowSize);
            }

            const timeLeft = await redis.ttl(key);

            if (
                opts.write_headers === undefined ||
                opts.write_headers === true
            ) {
                res.setHeader("X-RateLimit-Limit", maxRequests.toString());
                res.setHeader(
                    "X-RateLimit-Remaining",
                    Math.max(0, maxRequests - current).toString()
                );
                res.setHeader(
                    "X-RateLimit-Reset",
                    Math.floor(Date.now() / 1000) + timeLeft
                );
            }

            if (current > maxRequests) {
                const expiresAt = new Date(
                    Date.now() + timeLeft * 1000
                ).toISOString();
                const expiredIn = `${timeLeft} seconds`;

                throw new TooManyRequestsError({
                    message:
                        opts.error_message ||
                        "Rate limit exceeded. Try again later.",
                    context: {
                        expiresAt,
                        expiredIn,
                    },
                });
            }

            next();
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            } else {
                console.error("Rate limiter error:", error);
                throw new InternalServerError();
            }
        }
    };
