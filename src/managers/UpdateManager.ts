import { UpdateManagerParams } from "~/utils/types";
import axios from "axios";
import runCmd from "~/utils/cmd";

export default class UpdateManager {
    repository: string;
    branch: string;
    authToken: string | undefined;
    updateCheckInterval: number;
    remoteName: string;

    constructor(params: UpdateManagerParams) {
        this.repository = params.repository;
        this.branch = params.branch || "main";
        this.remoteName = params.remoteName || "origin";
        this.authToken = params.authToken;
        this.updateCheckInterval = params.updateCheckInterval;

        if (this.updateCheckInterval && params.autoUpdate) {
            setInterval(async () => {
                if (await this.isUpToDate()) return;
                console.log("New update detected! Updating ...");
                await this.update();
                await this.updateDependencies();
                console.log("Update complete. Shutting down.");
                process.exit(0);
            }, this.updateCheckInterval);
        }
    }

    update = async () => {
        const output = await runCmd(
            `git pull ${this.remoteName} ${this.branch}`
        );
        return output;
    };

    updateDependencies = async () => {
        const output = await runCmd("npm install");
        return output;
    };

    isUpToDate = async () => {
        const headers = this.authToken
            ? {
                  headers: {
                      Authorization: `Bearer ${this.authToken}`,
                  },
              }
            : undefined;

        const response = await axios.get(
            `https://api.github.com/repos/${this.repository}/branches/${this.branch}`,
            headers
        );

        const latestCommit = response.data.commit.sha;
        const currentCommit = await runCmd("git rev-parse HEAD");

        return latestCommit == currentCommit;
    };
}
