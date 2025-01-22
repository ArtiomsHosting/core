import { VerificationToken } from "~/lib";
import { Mail } from "~/lib/Mail";
import { BadRequestError } from "~/managers/ErrorManager";
import { AuthGuard } from "~/middlewares/AuthGuard";
import { RateLimit } from "~/middlewares/RateLimit";
import { ApiHandler } from "~/utils/types";

export const preHandlers = [
    AuthGuard(),
    RateLimit({
        key_prefix: "email-verify-rate-limit",
        maxRequests: 5,
        windowSize: 3600,
        write_headers: false,
        error_message:
            "You have exceeded the ammount of times to request a verification email",
    }),
] as const;

export const handler: ApiHandler<typeof preHandlers> = async (req, res) => {
    if (req.user.isEmailVerified())
        throw new BadRequestError({
            message: "Your email is already verified",
        });

    const verifyToken = await VerificationToken.create(req.user.id, "email", {
        exp_in: "10m",
    });

    /** @todo This might be a vulnerability and will be deprecated soon */
    const verify_url = `${req.protocol}://${req.get("host")}${
        req.originalUrl
    }/callback?code=${verifyToken.token}`;

    try {
        const mail = new Mail(Mail.TEMPLATE.VERIFY_EMAIL(verify_url));
        await mail.send(req.user.email);
    } catch (err) {
        await verifyToken.delete();
        throw err;
    }

    res.status(203).send();
};
