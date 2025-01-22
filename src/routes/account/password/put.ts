import Joi from "joi";
import { AuthGuard } from "~/middlewares/AuthGuard";
import { MfaGuard } from "~/middlewares/MfaGuard";
import { validate } from "~/middlewares/validate";
import { ApiHandler } from "~/utils/types";

const SCHEMA = {
    body: {
        oldPassword: Joi.string().required(),
        newPassword: Joi.string()
            .pattern(
                new RegExp(
                    "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9@$!%*?&]{8,256}$"
                )
            )
            .required()
            .messages({
                "string.pattern.base":
                    "Password must be 8-256 characters long, include at least " +
                    "one uppercase letter, one lowercase letter, one number, " +
                    "and one special character.",
            }),
    },
};

export const preHandlers = [AuthGuard(), MfaGuard(), validate(SCHEMA)] as const;

export const handler: ApiHandler<typeof preHandlers> = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    await req.user.updatePassword(oldPassword, newPassword);
    res.sendStatus(203);
};
