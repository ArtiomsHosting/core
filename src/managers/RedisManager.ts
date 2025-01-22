import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config(); // idk why

export const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT!),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
});

redis.on("connect", () => {
    console.log("Connected to Redis!");
});

redis.on("error", (err) => {
    console.error("Redis connection error:", err);
});

export default redis;
