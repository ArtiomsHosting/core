import { NextFunction, Request, Response } from "express";
import Joi from "joi";

export interface ExpressManagerParams {
    port: number;
}

export interface UpdateManagerParams {
    repository: string;
    branch?: string;
    autoUpdate: boolean;
    authToken?: string;
    updateCheckInterval: number;
    remoteName?: string;
}

export interface FileRouterParams {
    path: string;
}

export type JoiSchemaToType<T> = T extends Joi.StringSchema
    ? string
    : T extends Joi.NumberSchema
    ? number
    : T extends Joi.BooleanSchema
    ? boolean
    : T extends Joi.ArraySchema
    ? unknown[]
    : T extends Joi.ObjectSchema<infer R>
    ? { [K in keyof R]: JoiSchemaToType<R[K]> }
    : unknown;

export type ParseSchema<
    S extends {
        body?: Record<string, Joi.Schema>;
        param?: Record<string, Joi.Schema>;
        query?: Record<string, Joi.Schema>;
    }
> = {
    body: S["body"] extends Record<string, Joi.Schema>
        ? { [K in keyof S["body"]]: JoiSchemaToType<S["body"][K]> }
        : {};
    param: S["param"] extends Record<string, Joi.Schema>
        ? { [K in keyof S["param"]]: JoiSchemaToType<S["param"][K]> }
        : {};
    query: S["query"] extends Record<string, Joi.Schema>
        ? { [K in keyof S["query"]]: JoiSchemaToType<S["query"][K]> }
        : {};
};

export interface APIHandlerOptions {
    addon?: any;
    validationSchema?: {
        body?: Record<string, Joi.Schema>;
        param?: Record<string, Joi.Schema>;
        query?: Record<string, Joi.Schema>;
    };
}

export type APIHandler<T extends APIHandlerOptions = {}> = (
    req: (T["addon"] extends Record<string, any> ? T["addon"] : {}) &
        Request<
            T["validationSchema"] extends { param: any }
                ? ParseSchema<T["validationSchema"]>["param"]
                : any,
            any,
            T["validationSchema"] extends { body: any }
                ? ParseSchema<T["validationSchema"]>["body"]
                : any,
            T["validationSchema"] extends { query: any }
                ? ParseSchema<T["validationSchema"]>["query"]
                : any
        >,
    res: Response,
    next: NextFunction
) => any;
