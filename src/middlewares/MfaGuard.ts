import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { Mail, User } from "~/lib";
import { MFA } from "~/lib/MFA";
import { BadRequestError, InternalServerError } from "~/managers/ErrorManager";
import { ParseSchema } from "~/utils/types";
import speakeasy from "speakeasy";
import { randomInt } from "~/utils/gen";
import { expiresAt, toMs } from "~/utils/time";

const SCHEMA = {
    body: {
        mfa_type: Joi.string().valid("EMAIL", "TOTP"),
        mfa_code: Joi.string(),
    },
};

export const MfaGuard =
    (opts?: {
        filter: (req: Request<any, any, any, any> & { user: User }) => boolean;
    }) =>
    async (
        req: Request<
            unknown,
            unknown,
            ParseSchema<typeof SCHEMA.body>,
            unknown
        > & {
            user: User;
            mfa: MFA;
        },
        res: Response,
        next: NextFunction
    ) => {
        if (!req.user)
            throw new InternalServerError({
                message: "Mfa Guard required Auth Guard before it",
            });

        const mfas = await MFA.findByUserId(req.user.id);
        const mf_email = mfas.find((x) => x.type == "EMAIL");
        const mf_totp = mfas.find((x) => x.type == "TOTP");
        const mfa_type = req.body?.mfa_type;
        const mfa_code = req.body?.mfa_code;

        if (!mfa_type && mfas.length) {
            throw new BadRequestError({
                message:
                    "This user has multi-factor authentication enabled. Please specify the MFA type (EMAIL or TOTP) and provide the corresponding code.",
                context: {
                    email_mfa: !!mf_email,
                    totp_mfa: !!mf_totp,
                },
            });
        } else if (mfa_type == "TOTP") {
            if (!mf_totp)
                throw new BadRequestError({
                    message: "TOTP MFA is not enabled for this user",
                });

            if (!mfa_code)
                throw new BadRequestError({
                    message: "TOTP code is missing",
                });

            const isValid = speakeasy.totp.verify({
                secret: mf_totp.secret,
                encoding: "base32",
                token: mfa_code,
            });

            if (!isValid)
                throw new BadRequestError({
                    message: "The multifactor authentication code is invalid",
                });

            req.mfa = mf_totp;
            await mf_totp.updateDetails({
                secret: "",
            });
        } else if (mfa_type == "EMAIL") {
            if (!mf_email) {
                throw new BadRequestError({
                    message: "Email MFA is not enabled for this user.",
                });
            }
            if (mfa_code) {
                if (!mf_email.isExpired() && mf_email.secret !== mfa_code)
                    throw new BadRequestError({
                        message: "Wrong or expired MFA code",
                    });
                req.mfa = mf_email;
                await mf_email.updateDetails({
                    secret: "",
                });
            } else {
                const code = randomInt(6).toString();

                const email = new Mail(Mail.TEMPLATE.MFA_EMAIL(code));
                await email.send(req.user.email);
                await mf_email.updateDetails({
                    secret: code,
                    expiresAt: expiresAt(toMs("10m")),
                });

                throw new BadRequestError({
                    message:
                        "A email verification code has been sent to your email",
                });
            }
        }

        next();
    };
