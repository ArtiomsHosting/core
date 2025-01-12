import { APIHandler, FileRouterParams } from "~/utils/types";
import fs from "fs";
import path from "path";

interface FileObject {
    route: string;
    path: string;
    preHandlers: APIHandler[];
    handler: APIHandler;
}

export default class FileRouter {
    routerPath: string;
    endpoints: FileObject[] = [];
    constructor(params: FileRouterParams) {
        this.routerPath = params.path;
    }

    getObject = (dir: string = this.routerPath) => {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (let file of files) {
            const fname = file?.path || file.name;
            if (file.isDirectory()) {
                this.getObject(path.join(fname, file.name));
                continue;
            }

            const fileroute = path.join(file.path, file.name);
        }
    };
}
