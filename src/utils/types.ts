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

export type ParseJoiType<T> = T extends Joi.StringSchema<any>
    ? string
    : T extends Joi.NumberSchema<any>
    ? number
    : T extends Joi.BooleanSchema<any>
    ? boolean
    : T extends Joi.ArraySchema<any>
    ? any[]
    : T extends Joi.ObjectSchema<any>
    ? { [K in keyof T]: ParseJoiType<T[K]> }
    : never;

export type ParseSchema<T> = {
    [K in keyof T]: T[K] extends Joi.Schema
        ? ParseJoiType<T[K]>
        : T[K] extends object
        ? ParseSchema<T[K]>
        : T[K];
};

export type RequestAfterMiddlewares<T extends readonly any[]> =
    T extends readonly [infer First, ...infer Rest]
        ? First extends (
              req: infer Req,
              res: Response,
              next: NextFunction
          ) => void
            ? Rest extends readonly []
                ? Req
                : RequestAfterMiddlewares<Rest> & Req
            : never
        : never;

export type ApiHandler<T extends readonly any[] = [], K = unknown> = (
    req: T extends [] ? Request : RequestAfterMiddlewares<T> & K,
    res: Response,
    next: NextFunction
) => any;
