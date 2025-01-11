import express, { Express } from "express";
import { ExpressManagerParams } from "~/utils/types";

export default class ExpressManager {
    app: Express;
    port: number | string;
    isListening: boolean = false;

    constructor(params: ExpressManagerParams) {
        this.app = express();
        this.port = params.port;
    }

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
