import { randomBytes } from "crypto";
import { base64 } from "./crypt";
import crypto from "crypto";

export function randomInt(length: number = 6): number {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;

    return crypto.randomInt(min, max + 1);
}

export function randomString(length: number = 32): string {
    const buffer = randomBytes(length);
    return buffer.toString("base64");
}

export function generateSessionToken(
    user_id: number,
    length: number = 64
): string {
    const uid = base64.encode(user_id) + ".";
    const randstr = randomString(length - uid.length);
    return uid + randstr;
}

export function tokenToUserID(token: string) {
    const t = token.split(".");
    if (t.length !== 2) return null;
    return Number(base64.decode(t[0]));
}
