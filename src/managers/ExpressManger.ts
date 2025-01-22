import express, { Express } from "express";
import { ExpressManagerParams } from "~/utils/types";
import FileRouter from "./FileRouter";
import { errorHandler } from "~/middlewares/errorHandler";
import bodyParser from "~/middlewares/bodyParser";
import "express-async-errors";
import { fetchIp } from "~/middlewares/fetchIp";

export default class ExpressManager {
    app: Express;
    port: number | string;
    isListening: boolean = false;
    fileRouter: FileRouter;

    constructor(params: ExpressManagerParams) {
        this.app = express();
        this.port = params.port;
        this.fileRouter = new FileRouter({
            path: "dist/routes",
        });
    }

    registerRoutes = (cb?: (m: string) => any) => {
        const endpoints = this.fileRouter.build().sort().getEndpoints();

        this.app.set("trust proxy", process.env.TRUSTED_PROXIES?.split(","));
        this.app.use(bodyParser);
        this.app.use(fetchIp);

        for (let endpoint of endpoints) {
            if (cb) cb(`Registering ${endpoint.method} ${endpoint.route}`);
            this.app[endpoint.method](
                endpoint.route,
                ...endpoint.preHandlers,
                endpoint.handler
            );
        }

        this.app.use(errorHandler);
    };

    listen = () =>
        new Promise<string>((resolve, reject) => {
            const server = this.app.listen(this.port, () => {
                this.isListening = true;
                resolve(
                    `Server is successfully listening on port ${this.port}`
                );
            });

            server.on("error", (err) => {
                this.isListening = false;
                reject(
                    `Error launching the server on port ${this.port}. ${err}`
                );
            });
        });
}
