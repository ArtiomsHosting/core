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
    console.log("Checking for updates");
    const isUpToDate = await updateManager.isUpToDate();
    if (isUpToDate) {
        console.log("Program is up to date");
    } else {
        console.log("\nUpdating ... ");
        const updateData = await updateManager.update();
        console.log(updateData);
        console.log("\nUpdating dependencies ...");
        const updateDepsData = await updateManager.updateDependencies();
        console.log(updateDepsData);

        console.log("\nUpdate complete, exiting the program");
        process.exit(0);
    }
})();

// express.listen().then(console.log);
