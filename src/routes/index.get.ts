import Joi from "joi";
import { APIHandler } from "~/utils/types";

const validationSchema = {
    body: {
        str_test: Joi.string().required(),
        optional_number: Joi.number().min(5).max(20),
        email: Joi.string().email().required(),
        arrexample: Joi.array().has(Joi.string()),
    },
    param: {
        alsotest: Joi.string().required(),
    },
    query: {
        test: Joi.string(),
    },
};

export const preHandler: APIHandler[] = [];

export const handler: APIHandler<{
    validationSchema: typeof validationSchema;
}> = (req, res, next) => {};
