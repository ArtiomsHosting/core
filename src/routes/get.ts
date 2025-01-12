import Joi from "joi";
import { APIHandler } from "~/utils/types";

const validationSchema = {
    body: {
        test: Joi.string().required(),
    },
};

export const preHandler: APIHandler[] = [];

export const handler: APIHandler<{
    validationSchema: typeof validationSchema;
}> = (req, res, next) => {
    res.send({ message: "Hello world" });
};
