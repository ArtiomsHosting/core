import { ApiHandler } from "~/utils/types";
import { Session, User } from "~/lib";
import { validate } from "~/middlewares/validate";
import Joi from "joi";

const SCHEMA = {
    body: {
        username: Joi.string()
            .pattern(/^[a-zA-Z0-9._]+$/)
            .pattern(/^(?!.*[_.]$)/)
            .min(3)
            .max(32)
            .required()
            .messages({
                "string.pattern.base":
                    "Username can only contain letters, numbers, underscores (_), " +
                    "and periods (.) and must not end with a period (.) or underscore (_).",
            }),
        email: Joi.string().max(256).email().required(),
        password: Joi.string()
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

export const preHandlers = [validate(SCHEMA)] as const;

export const handler: ApiHandler<typeof preHandlers> = async (req, res) => {
    const { username, email, password } = req.body;
    const user = await User.create({
        username: username.toLocaleLowerCase(),
        email: email.toLocaleLowerCase(),
        credentials: { password },
    });

    const session = await Session.create(user.id, {
        ip: req.ip,
        agent: req.headers["user-agent"],
        issuedBy: "CREDENTIAL",
    });

    res.status(200).send({ user: user, session: session });
};
