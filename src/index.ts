import dotenv from "dotenv";
dotenv.config();

import ExpressManager from "~/managers/ExpressManger";
import UpdateManager from "./managers/UpdateManager";

const updateManager = new UpdateManager({
    autoUpdate: process.env.GITHUB_AUTO_UPDATE == "true",
    updateCheckInterval: Number(process.env.GITHUB_CHECK_INTERVAL || 0),
    authToken: process.env.GITHUB_TOKEN,
    remoteName: process.env.GITHUB_REMOTE_NAME,
    repository: process.env.GITHUB_REPO!,
    branch: process.env.GITHUB_BRANCH,
});

const express = new ExpressManager({
    port: Number(process.env?.PORT || 3000),
});

(async () => {
    if (process.env?.GITHUB_AUTO_UPDATE == "true") {
        console.log("Checking for updates");
        await updateManager.update(console.log).then(console.log);
    }

    express.registerRoutes(console.log);
    express.listen().then(console.log);
})();
