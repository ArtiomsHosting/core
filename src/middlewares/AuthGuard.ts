import { NextFunction, Request, Response } from "express";
import { User } from "~/lib";
import { ForbiddenError, UnauthorizedError } from "~/managers/ErrorManager";
import { tokenToUserID } from "~/utils/gen";

export const AuthGuard =
    (opts?: {
        filter: (req: Request<any, any, any, any> & { user: User }) => boolean;
    }) =>
    async (
        req: Request<unknown, unknown, unknown, unknown> & { user: User },
        res: Response,
        next: NextFunction
    ) => {
        const auth_header = req.headers.authorization;

        if (!auth_header) {
            throw new UnauthorizedError({
                message: "Missing authorization header",
            });
        }

        const typetoken = auth_header.split(" ");
        if (typetoken.length != 2) {
            throw new UnauthorizedError({
                message: "Invalid authorization header",
            });
        }

        const [type, token] = typetoken;
        if (type !== "Bearer") {
            throw new UnauthorizedError({
                message: "Invalid token type",
            });
        }

        const user_id = tokenToUserID(token);
        if (!user_id) {
            throw new UnauthorizedError({
                message: "Invalid token",
            });
        }

        const user = await User.findById(user_id);
        if (!user || !(await user.checkToken(token))) {
            throw new UnauthorizedError({
                message: "Invalid token",
            });
        }

        req.user = user;
        if (opts?.filter && !opts.filter(req)) throw new ForbiddenError();

        next();
    };
