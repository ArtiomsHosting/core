import { AuthGuard } from "~/middlewares/AuthGuard";
import { ApiHandler } from "~/utils/types";
import speakeasy from "speakeasy";
import { VerificationToken } from "~/lib";
import { expiresIn, toMs } from "~/utils/time";
import { MFA } from "~/lib/MFA";
import { BadRequestError } from "~/managers/ErrorManager";
import Joi from "joi";
import { validate } from "~/middlewares/validate";

const SCHEMA = {
    body: {
        password: Joi.string().required(),
    },
};

export const preHandlers = [AuthGuard(), validate(SCHEMA)] as const;

export const handler: ApiHandler<typeof preHandlers> = async (req, res) => {
    if (!(await req.user.checkPassword(req.body.password)))
        throw new BadRequestError({ message: "Incorrect password" });

    const user_mfa = await MFA.findByUserId(req.user.id, "TOTP");
    if (!user_mfa)
        throw new BadRequestError({
            message: "You dont have totp mfa enabled",
        });

    await user_mfa.delete();

    res.status(203).send();
};
