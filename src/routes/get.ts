import { ApiHandler } from "~/utils/types";

export const handler: ApiHandler = (req, res, next) => {
    res.send({ message: "Hello world" });
};
