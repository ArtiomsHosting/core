import { NextFunction, Request, Response } from "express";
import { ApiError } from "~/managers/ErrorManager";

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof ApiError) {
        const { statusCode, errors, logging } = err;

        if (logging) {
            console.error(
                JSON.stringify(
                    {
                        code: err.statusCode,
                        errors: err.errors,
                        stack: err.stack,
                    },
                    null,
                    2
                )
            );
        }

        res.status(statusCode).send({ errors });
        return;
    }

    console.error("Unhandled Error.", err);
    res.status(500).send({ errors: [{ message: "Something went wrong" }] });
};
