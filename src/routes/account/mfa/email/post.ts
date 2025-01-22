import { AuthGuard } from "~/middlewares/AuthGuard";
import { ApiHandler } from "~/utils/types";
import speakeasy from "speakeasy";
import { VerificationToken } from "~/lib";
import { expiresIn, toMs } from "~/utils/time";
import { MFA } from "~/lib/MFA";
import { BadRequestError } from "~/managers/ErrorManager";

export const preHandlers = [AuthGuard()] as const;

export const handler: ApiHandler<typeof preHandlers> = async (req, res) => {
    if (!req.user.isEmailVerified())
        throw new BadRequestError({
            message: "The email must be verified before enabling this feature",
        });

    const user_mfa = await MFA.findByUserId(req.user.id, "EMAIL");
    if (user_mfa)
        throw new BadRequestError({
            message: "You aready have email verification enabled",
        });

    await MFA.create(req.user.id, "EMAIL", "");

    res.status(203).send();
};
