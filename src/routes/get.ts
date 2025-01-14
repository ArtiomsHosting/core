import Joi from "joi";
import { validate } from "~/middlewares/validate";
import { ApiHandler } from "~/utils/types";

const validationSchema = {
    query: {
        nr: Joi.number().required().min(5).max(30),
        is: Joi.boolean(),
    },
};

export const preHandlers = [validate(validationSchema)] as const;

export const handler: ApiHandler<typeof preHandlers> = (req, res, next) => {
    res.send({ message: req.query.nr, is: req.query.is });
};
