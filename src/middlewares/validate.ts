import { ParseSchema } from "~/utils/types";
import { BadRequestError } from "~/managers/ErrorManager";
import Joi from "joi";
import { NextFunction, Request, Response } from "express";

export const validate =
    <T>(schema: T) =>
    (
        req: Request<
            ParseSchema<T> extends { params: infer Params } ? Params : unknown,
            unknown,
            ParseSchema<T> extends { body: infer Body } ? Body : unknown,
            ParseSchema<T> extends { query: infer Query } ? Query : unknown
        >,
        _: Response,
        next: NextFunction
    ) => {
        const details: { [key: string]: any }[] = [];

        function validateObject(schema: any, data: any, been: string[] = []) {
            for (let [key, value] of Object.entries(schema)) {
                const wherearewe = [...been, key];

                if (
                    value instanceof Object &&
                    !value.hasOwnProperty("$_root")
                ) {
                    validateObject(value, data[key] || {}, wherearewe);
                    continue;
                }

                const { error, value: validatedValue } = (
                    value as Joi.AnySchema
                ).validate(data[key]);

                if (!error) {
                    setNestedValue(req, wherearewe, validatedValue);
                    continue;
                }

                for (const err_detail of error.details) {
                    details.push({
                        message: err_detail.message.replace("value", key),
                        key: key,
                        location: wherearewe.join("."),
                        expected: err_detail.type,
                        got: data[key],
                    });
                }
            }
        }

        validateObject(schema, req);

        if (details.length)
            throw new BadRequestError({
                message: "The request did not pass data validation",
                context: details,
            });

        next();
    };

function setNestedValue(obj: any, path: string[], value: any) {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
}
