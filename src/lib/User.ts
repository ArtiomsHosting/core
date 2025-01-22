import { Prisma, PrismaClient, User as UserModel } from "@prisma/client";
import db, { DatabaseManager } from "~/managers/DatabaseManager";
import { Account } from "./Account";
import { BadRequestError } from "~/managers/ErrorManager";
import { compare, hash } from "~/utils/crypt";
import { MFA } from "./MFA";
import { Session } from "./Session";

export class User {
    private userData: UserModel;

    constructor(userData: UserModel) {
        this.userData = userData;
    }

    get id(): number {
        return this.userData.id;
    }

    get email(): string {
        return this.userData.email;
    }

    get username(): string {
        return this.userData.username;
    }

    get pictureUrl(): string | null {
        return this.userData.picture_url;
    }

    get verifiedEmail(): Date | null {
        return this.userData.verified_email;
    }

    isEmailVerified(): boolean {
        return this.verifiedEmail !== null;
    }

    async checkPassword(pass: string): Promise<boolean> {
        const credentials = await db.prisma.credential.findUnique({
            where: { user_id: this.userData.id },
        });
        if (!credentials) return false;
        return await compare(pass, credentials.password_hash);
    }

    async checkToken(token: string): Promise<boolean> {
        const sessions = await db.prisma.session.findUnique({
            where: { session_token: token },
        });
        return !!sessions;
    }

    async fetchSelf(include: Prisma.UserInclude) {
        const usr = await db.prisma.user.findUnique({
            where: {
                id: this.id,
            },
            include,
        });
        if (!usr) return null;
        const { credentials, mfa, accounts, sessions, ...usrData } = usr;
        if (credentials) credentials.password_hash = "shhhh, secret...";

        return {
            ...new User(usrData),
            mfa: mfa ? mfa.map((x) => new MFA(x)) : undefined,
            sessions: sessions
                ? sessions.map((x) => new Session(x))
                : undefined,
            credentials,
        };
    }

    async updateDetails(data: Partial<UserModel>) {
        const updatedUser = await db.prisma.user.update({
            where: { id: this.id },
            data,
        });
        this.userData = updatedUser;
        return this;
    }

    async delete() {
        await db.prisma.user.delete({
            where: { id: this.id },
        });
    }

    static async findById(userId: number) {
        const userData = await db.prisma.user
            .findUnique({
                where: { id: userId },
            })
            .catch(() => null);

        return userData ? new User(userData) : null;
    }

    static async findByEmail(email: string) {
        const userData = await db.prisma.user
            .findUnique({
                where: { email: email.toLocaleLowerCase() },
            })
            .catch(() => null);
        return userData ? new User(userData) : null;
    }

    static create = async (
        params: { username: string; email: string } & {
            credentials?: { password: string };
            account?: {
                provider: (typeof Account.OAUTH_PROVIDERS)[number];
                refresh_token: string;
                access_token: string;
                token_type: string;
                expiresAt: Date;
            };
            opts?: {
                session_exp_in?: string;
                ip?: string;
                agent?: string;
            };
        }
    ) => {
        let user: UserModel;

        try {
            if (params.credentials) {
                user = await db.prisma.user.create({
                    data: {
                        username: params.username.toLocaleLowerCase(),
                        email: params.email.toLocaleLowerCase(),
                        credentials: {
                            create: {
                                password_hash: await hash(
                                    params.credentials.password
                                ),
                            },
                        },
                    },
                });
            } else if (
                params.account &&
                Account.OAUTH_PROVIDERS.includes(params.account.provider)
            ) {
                user = await db.prisma.user.create({
                    data: {
                        username: params.username.toLocaleLowerCase(),
                        email: params.email.toLocaleLowerCase(),
                        accounts: {
                            create: params.account,
                        },
                    },
                });
            } else {
                throw new BadRequestError({
                    message:
                        "Either credentials or account details must be provided",
                });
            }
        } catch (err) {
            DatabaseManager.handleErrors(err, {
                2002: "This email or username is already in use",
            });
        }

        return new User(user!);
    };

    async updatePassword(oldPassword: string, newPassword: string) {
        if (!(await this.checkPassword(oldPassword)))
            throw new BadRequestError({ message: "Incorrect password" });

        await db.prisma.credential.update({
            where: {
                user_id: this.userData.id,
            },
            data: {
                password_hash: await hash(newPassword),
            },
        });
    }

    toJSON() {
        return {
            id: this.id,
            email: this.email,
            username: this.username,
            pictureUrl: this.pictureUrl,
            verifiedEmail: this.verifiedEmail,
            createdAt: this.userData.createdAt,
            updatedAt: this.userData.updatedAt,
        };
    }
}
