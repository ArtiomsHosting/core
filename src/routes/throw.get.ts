import Joi from "joi";
import { InternalServerError } from "~/managers/ErrorManager";
import { ApiHandler } from "~/utils/types";

export const handler: ApiHandler = async (req, res) => {
    throw new InternalServerError({
        message: "some error happend..",
        context: { imagine: "lol" },
    });
};
