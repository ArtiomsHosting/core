import { AuthGuard } from "~/middlewares/AuthGuard";
import { ApiHandler } from "~/utils/types";
import speakeasy from "speakeasy";
import { VerificationToken } from "~/lib";
import { expiresIn, toMs } from "~/utils/time";
import { MFA } from "~/lib/MFA";
import { BadRequestError } from "~/managers/ErrorManager";

export const preHandlers = [AuthGuard()] as const;

export const handler: ApiHandler<typeof preHandlers> = async (req, res) => {
    const user_mfa = await MFA.findByUserId(req.user.id, "TOTP");
    if (user_mfa)
        throw new BadRequestError({
            message: "You aready have totp verification enabled",
        });

    const secret = speakeasy.generateSecret();
    const exp_time = "10m";

    await VerificationToken.create(req.user.id, "TOTP", {
        token: secret.base32,
        exp_in: exp_time,
    });

    res.status(200).send({
        expiresIn: expiresIn(toMs(exp_time)),
        otpauth_url: secret.otpauth_url,
    });
};
