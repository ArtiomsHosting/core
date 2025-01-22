import { AuthGuard } from "~/middlewares/AuthGuard";
import { ApiHandler } from "~/utils/types";
import speakeasy from "speakeasy";
import { VerificationToken } from "~/lib";
import { expiresIn, toMs } from "~/utils/time";
import Joi from "joi";
import { validate } from "~/middlewares/validate";
import { BadRequestError } from "~/managers/ErrorManager";
import { MFA } from "~/lib/MFA";

const SCHEMA = {
    body: {
        code: Joi.string().required(),
    },
};

export const preHandlers = [AuthGuard(), validate(SCHEMA)] as const;

export const handler: ApiHandler<typeof preHandlers> = async (req, res) => {
    const secrets = await VerificationToken.findByUserId(req.user.id);
    if (!secrets.length)
        throw new BadRequestError({
            message: "The authenticaton code requested had expired",
        });

    let secret!: VerificationToken;
    let verified = false;

    for (let i of secrets) {
        var valid = speakeasy.totp.verify({
            secret: i.token,
            encoding: "base32",
            token: req.body.code,
        });

        if (valid) {
            verified = true;
            secret = i;
            break;
        }
    }

    if (!verified)
        throw new BadRequestError({ message: "Invalid verification token" });

    await secret.delete();
    await MFA.create(req.user.id, "TOTP", secret.token);

    res.status(200).send({
        verified,
    });
};
