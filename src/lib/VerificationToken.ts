import { VerificationToken as VerificationTokenModel } from "@prisma/client";
import db from "~/managers/DatabaseManager";
import { generateSessionToken } from "~/utils/gen";
import { expiresAt, toMs } from "~/utils/time";

export class VerificationToken {
    private verificationTokenData: VerificationTokenModel;

    constructor(verificationTokenData: VerificationTokenModel) {
        this.verificationTokenData = verificationTokenData;
    }

    get id(): number {
        return this.verificationTokenData.id;
    }

    get userId(): number {
        return this.verificationTokenData.user_id;
    }

    get token(): string {
        return this.verificationTokenData.token;
    }

    get expiresAt(): Date | null {
        return this.verificationTokenData.expiresAt;
    }

    get type(): string {
        return this.verificationTokenData.type;
    }

    get createdAt(): Date {
        return this.verificationTokenData.createdAt;
    }

    get updatedAt(): Date {
        return this.verificationTokenData.updatedAt;
    }

    isExpired(): boolean {
        return this.expiresAt !== null && this.expiresAt <= new Date();
    }

    async delete() {
        await db.prisma.verificationToken.delete({
            where: { id: this.id },
        });
    }

    static async findByToken(token: string) {
        const verificationTokenData =
            await db.prisma.verificationToken.findFirst({
                where: {
                    token: token,
                    OR: [
                        { expiresAt: { gt: new Date() } },
                        { expiresAt: null },
                    ],
                },
            });

        return verificationTokenData
            ? new VerificationToken(verificationTokenData)
            : null;
    }

    static async findByUserId(userId: number) {
        const verificationTokens = await db.prisma.verificationToken.findMany({
            where: {
                user_id: userId,
                OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],
            },
        });
        return verificationTokens.map(
            (verificationToken) => new VerificationToken(verificationToken)
        );
    }

    static async create(
        user_id: number,
        type: string,
        opts?: { exp_in?: string; token?: string }
    ) {
        const newVerificationToken = await db.prisma.verificationToken.create({
            data: {
                user_id: user_id,
                type: type,
                token: opts?.token || generateSessionToken(user_id, 32),
                expiresAt: expiresAt(toMs(opts?.exp_in || "10m")),
            },
        });

        return new VerificationToken(newVerificationToken);
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            token: this.token,
            expiresAt: this.expiresAt,
            type: this.type,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
