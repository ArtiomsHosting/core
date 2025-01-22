import fs from "fs";
import path from "path";
import { ApiHandler, FileRouterParams } from "~/utils/types";

export interface FileObject {
    route: string;
    method: FileRouter["validMethods"][number];
    preHandlers: ApiHandler[];
    handler: ApiHandler;
}

export default class FileRouter {
    routerPath: string;
    endpoints: FileObject[] = [];
    validMethods = ["get", "post", "put", "patch", "delete", "all"] as const;
    private globalPath = path.join(__dirname, "..").replace(/\\/g, "/");

    constructor(params: FileRouterParams) {
        this.routerPath = path.join(params.path).replace(/\\/g, "/");
    }

    public build(dir: string = this.routerPath): this {
        const files = fs.readdirSync(dir, { withFileTypes: true });

        for (const file of files) {
            const filePath = path.join(dir, file.name);

            if (file.isDirectory()) {
                this.build(filePath);
                continue;
            }

            const { route, method, handler, preHandlers } = this.processFile(
                filePath.replace(/\\/g, "/").replace(this.routerPath + "/", "")
            );

            if (route && method && handler) {
                this.endpoints.push({
                    route,
                    method,
                    preHandlers: preHandlers || [],
                    handler,
                });
            }
        }

        return this;
    }

    public sort(): this {
        this.endpoints.sort((a, b) => {
            const dynamicSegment = /:[^/]+/;

            if (dynamicSegment.test(a.route) && !dynamicSegment.test(b.route)) {
                return 1;
            } else if (
                !dynamicSegment.test(a.route) &&
                dynamicSegment.test(b.route)
            ) {
                return -1;
            }

            if (a.route.length !== b.route.length) {
                return b.route.length - a.route.length;
            }

            return 0;
        });

        return this;
    }

    private processFile(filePath: string): Partial<FileObject> {
        const fp = filePath.replace("\\", "/").split("/");
        const fname = fp.pop();

        if (!fname) {
            console.warn(`Skipping file ${filePath} due to invalid method.`);
            return {};
        }

        let traverse = fp.length > 0 ? fp.join("/") + "/" : "";
        let [_, method, route] = fname?.split(".").reverse();
        route = "/" + traverse + (route || "");
        route = route
            .replace(this.routerPath, "")
            .replace(/\\/g, "/")
            .replace(/\[([^\[\]]+)\]/g, ":$1")
            .replace(/#/g, "*");

        if (!method || !this.validMethods.find((x) => x == method)) {
            console.warn(`Skipping file ${filePath} due to invalid method.`);
            return {};
        }

        let module;
        try {
            module = require(path.join(
                this.globalPath,
                this.routerPath,
                filePath
            ));
        } catch (err) {
            console.error(`Error loading module ${filePath}:`, err);
            return {};
        }

        if (!module.handler) {
            console.warn(
                `Skipping file ${filePath} because no handler is exported.`
            );
            return {};
        }

        return {
            route,
            method: method as (typeof this.validMethods)[number],
            handler: module.handler,
            preHandlers: module.preHandlers || [],
        };
    }

    public getEndpoints(): FileObject[] {
        return this.endpoints;
    }
}
