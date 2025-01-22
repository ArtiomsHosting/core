import { MFA as MFAModel } from "@prisma/client";
import db from "~/managers/DatabaseManager";
import { expiresAt, toMs } from "~/utils/time";

export class MFA {
    private mfaData: MFAModel;

    constructor(mfaData: MFAModel) {
        this.mfaData = mfaData;
    }

    get userId(): number {
        return this.mfaData.user_id;
    }

    get type(): string {
        return this.mfaData.type; // TOTP, EMAIL, etc.
    }

    get secret(): string {
        return this.mfaData.secret;
    }

    get expiresAt(): Date | null {
        return this.mfaData.expiresAt;
    }

    get createdAt(): Date {
        return this.mfaData.createdAt;
    }

    get updatedAt(): Date {
        return this.mfaData.updatedAt;
    }

    isExpired(): boolean {
        return this.expiresAt !== null && this.expiresAt <= new Date();
    }

    async delete() {
        await db.prisma.mFA.delete({
            where: { user_id_type: { user_id: this.userId, type: this.type } },
        });
    }

    static async findByUserId<T extends string | undefined = undefined>(
        userId: number,
        type?: T
    ): Promise<T extends undefined ? MFA[] : MFA | null> {
        if (typeof type == "string") {
            const mfaData = await db.prisma.mFA.findFirst({
                where: {
                    user_id: userId,
                    type: type,
                },
            });

            return (mfaData ? new MFA(mfaData) : null) as any;
        } else {
            const mfaData = await db.prisma.mFA.findMany({
                where: {
                    user_id: userId,
                },
            });

            return mfaData.map((mfa) => new MFA(mfa)) as any;
        }
    }

    static async create(
        user_id: number,
        type: string,
        secret: string,
        opts?: { exp_in?: string }
    ) {
        const newMFA = await db.prisma.mFA.create({
            data: {
                user_id: user_id,
                type: type,
                secret: secret,
                expiresAt: opts?.exp_in ? expiresAt(toMs(opts.exp_in)) : null,
            },
        });

        return new MFA(newMFA);
    }

    async updateDetails(data: Partial<MFAModel>) {
        const updatedMfa = await db.prisma.mFA.update({
            where: { user_id_type: { user_id: this.userId, type: this.type } },
            data,
        });
        this.mfaData = updatedMfa;
        return this;
    }

    toJSON() {
        return {
            userId: this.userId,
            type: this.type,
            secret: this.secret,
            expiresAt: this.expiresAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
