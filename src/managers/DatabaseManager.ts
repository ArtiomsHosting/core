import { Prisma, PrismaClient } from "@prisma/client";
import { ApiError, BadRequestError, InternalServerError } from "./ErrorManager";

export const OAUTH_PROVIDERS = ["DISCORD", "GOOGLE"] as const;

export class DatabaseManager {
    prisma: PrismaClient;
    static DEFAULT_SESSION_EXP = "1y";
    static DEFAULT_DICT = {
        2002: "Unique constraint violations.",
        2003: "Foreign key constraint violation.",
        3000: "Invalid data provided.",
        9999: "An unexpected error occoured",
    };

    constructor() {
        this.prisma = new PrismaClient();
        process.on("SIGINT", () => this.prisma.$disconnect());
        process.on("SIGTERM", () => this.prisma.$disconnect());
    }

    static handleErrors = (err: any, dict?: Record<number, string>) => {
        dict = {
            ...this.DEFAULT_DICT,
            ...dict,
        };

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2002") {
                throw new BadRequestError({
                    message: dict[2002],
                    context: { errorCode: err.code },
                });
            } else if (err.code === "P2003") {
                throw new BadRequestError({
                    message: dict[2003],
                    context: { errorCode: err.code },
                });
            }
        } else if (err instanceof Prisma.PrismaClientValidationError) {
            throw new BadRequestError({
                message: dict[3000],
            });
        } else if (err instanceof ApiError) {
            throw err;
        } else {
            throw new InternalServerError({
                message: dict[9999],
                logging: true,
                context: { error: err.message },
            });
        }
    };
}

export const db = new DatabaseManager();
export default db;
