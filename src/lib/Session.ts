import { PrismaClient, Session as SessionModel } from "@prisma/client";
import db from "~/managers/DatabaseManager";
import { generateSessionToken } from "~/utils/gen";
import { expiresAt, toMs } from "~/utils/time";

const prisma = new PrismaClient();

export class Session {
    private sessionData: SessionModel;
    static DEFAULT_SESSION_EXP = "1y";

    constructor(sessionData: SessionModel) {
        this.sessionData = sessionData;
    }

    get id(): number {
        return this.sessionData.id;
    }

    get userId(): number {
        return this.sessionData.user_id;
    }

    get sessionToken(): string {
        return this.sessionData.session_token;
    }

    get expiresAt(): Date | null {
        return this.sessionData.expiresAt;
    }

    get userIp(): string | null {
        return this.sessionData.user_ip;
    }

    get userAgent(): string | null {
        return this.sessionData.user_agent;
    }

    get issuedBy(): string {
        return this.sessionData.issuedBy;
    }

    get createdAt(): Date {
        return this.sessionData.createdAt;
    }

    get updatedAt(): Date {
        return this.sessionData.updatedAt;
    }

    isExpired(): boolean {
        return this.expiresAt !== null && this.expiresAt <= new Date();
    }

    async delete() {
        await prisma.session.delete({
            where: { id: this.id },
        });
    }

    static async findByToken(sessionToken: string) {
        const sessionData = await prisma.session.findUnique({
            where: { session_token: sessionToken },
        });
        return sessionData ? new Session(sessionData) : null;
    }

    static async findByUserId(userId: number) {
        const sessions = await prisma.session.findMany({
            where: { user_id: userId },
        });
        return sessions.map((session) => new Session(session));
    }

    static async create(
        user_id: number,
        opts?: {
            exp_in?: string;
            ip?: string;
            agent?: string;
            issuedBy?: string;
        }
    ) {
        const newSession = await db.prisma.session.create({
            data: {
                user_id: user_id,
                session_token: generateSessionToken(user_id, 64),
                expiresAt: expiresAt(
                    toMs(opts?.exp_in || this.DEFAULT_SESSION_EXP)
                ),
                issuedBy: opts?.issuedBy || "CREDENTAIL",
                user_ip: opts?.ip,
                user_agent: opts?.agent,
            },
        });

        return new Session(newSession);
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            expiresAt: this.expiresAt,
            userIp: this.userIp,
            userAgent: this.userAgent,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
