import { AuthGuard } from "~/middlewares/AuthGuard";
import { ApiHandler } from "~/utils/types";

export const preHandlers = [AuthGuard()] as const;

export const handler: ApiHandler<typeof preHandlers> = (req, res, next) => {
    res.status(200).send(req.user);
};
