import { ApiHandler } from "~/utils/types";
import { Account, Mail, Session, User } from "~/lib";
import { validate } from "~/middlewares/validate";
import Joi from "joi";
import {
    BadRequestError,
    NotImplementedError,
    UnauthorizedError,
} from "~/managers/ErrorManager";
import { MFA } from "~/lib/MFA";
import speakeasy from "speakeasy";
import { randomInt } from "~/utils/gen";
import { expiresAt, toMs } from "~/utils/time";
import { RateLimit } from "~/middlewares/RateLimit";
import { Request } from "express";

const SCHEMA = {
    body: {
        email: Joi.string().email(),
        password: Joi.string(),
        mfa_type: Joi.string().valid("EMAIL", "TOTP"),
        mfa_code: Joi.string(),
    },
    query: {
        provider: Joi.string().valid(...Account.OAUTH_PROVIDERS),
        code: Joi.string(),
    },
};

export const preHandlers = [
    RateLimit({
        key_prefix: "login-rate-limit",
        maxRequests: 50,
        windowSize: 3600,
        write_headers: false,
        error_message: "You have tried to login for too many times",
    }),
    validate(SCHEMA),
] as const;

export const handler: ApiHandler<typeof preHandlers> = async (req, res) => {
    const { email, password, mfa_type, mfa_code } = req.body;
    const { provider, code } = req.query;

    let user: User;

    if (email && password) {
        const tmp_user = await User.findByEmail(email);
        if (!tmp_user || !(await tmp_user.checkPassword(password)))
            throw new UnauthorizedError({ message: "Wrong email or password" });

        const mfas = await MFA.findByUserId(tmp_user.id);
        const mf_email = mfas.find((x) => x.type == "EMAIL");
        const mf_totp = mfas.find((x) => x.type == "TOTP");

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
                await mf_email.updateDetails({
                    secret: "",
                });
            } else {
                await RateLimit({
                    key_prefix: "login-email-mfa-rate-limit",
                    maxRequests: 5,
                    windowSize: 3600,
                    write_headers: false,
                    error_message:
                        "You have requested the authentication code for too many times. Please contact support",
                })(req as Request, res, () => {});

                const code = randomInt(6).toString();

                const email = new Mail(Mail.TEMPLATE.MFA_EMAIL(code));
                await email.send(tmp_user.email);
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

        user = tmp_user;
    } else if (provider && code) {
        /** @todo */
        throw new NotImplementedError();
    } else {
        throw new BadRequestError({
            message:
                "You need to provide a body with email and password or query with provider and code",
        });
    }

    const session = await Session.create(user.id, {
        ip: req.ip,
        agent: req.headers["user-agent"],
        issuedBy: req.body.mfa_type || "CREDENTIAL",
    });

    res.status(200).send({
        user,
        session,
    });
};
