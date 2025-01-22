import Joi from "joi";
import { AuthGuard } from "~/middlewares/AuthGuard";
import { validate } from "~/middlewares/validate";
import { ApiHandler } from "~/utils/types";

const SCHEMA = {
    query: {
        credential: Joi.boolean(),
        mfa: Joi.boolean(),
        accounts: Joi.boolean(),
        sessions: Joi.boolean(),
    },
};

export const preHandlers = [AuthGuard(), validate(SCHEMA)] as const;

export const handler: ApiHandler<typeof preHandlers> = async (
    req,
    res,
    next
) => {
    const user = await req.user.fetchSelf({
        credentials: req.query.credential,
        mfa: req.query.mfa,
        accounts: req.query.accounts,
        sessions: req.query.sessions,
    });

    res.status(200).send(user);
};
