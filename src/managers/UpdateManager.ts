import { UpdateManagerParams } from "~/utils/types";
import axios from "axios";
import runCmd from "~/utils/cmd";
import tryCatch from "~/utils/tryCatch";

export default class UpdateManager {
    repository: string;
    branch: string;
    authToken: string | undefined;
    updateCheckInterval: number;
    remoteName: string;
    currentCommitSign: string | undefined;

    constructor(params: UpdateManagerParams) {
        this.repository = params.repository;
        this.branch = params.branch || "main";
        this.remoteName = params.remoteName || "origin";
        this.authToken = params.authToken;
        this.updateCheckInterval = params.updateCheckInterval;

        if (this.updateCheckInterval && params.autoUpdate) {
            setInterval(async () => {
                const [data, error] = await tryCatch(this.update());
                if (data == "Running up to date" || error) return;
                console.log("New Update Detected has been aplied");
                console.log(data);
                process.exit(0);
            }, this.updateCheckInterval);
        }
    }

    update = async () => {
        const [isUpToDate, error] = await tryCatch(this.isUpToDate());
        if (error) throw new Error(`Error fetching cloud signature. ${error}`);
        if (isUpToDate) return "Running up to date";

        const [updateData, error1] = await tryCatch(this.updateCode());
        if (error1) throw new Error(`Error pulling the code. ${error1}`);
        if (!updateData.includes("Updating")) return "Running up to date";

        const [updateDeps, error2] = await tryCatch(this.updateDependencies());
        if (error2) throw new Error(`Error updating dependencies. ${error2}`);

        console.log(
            "Logs:\n\n" +
                updateData +
                "\n\n" +
                updateDeps +
                "\n\nUpdate successful, shutting down"
        );
        process.exit(0);
    };

    updateCode = async () => {
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
        this.currentCommitSign =
            this.currentCommitSign || (await runCmd("git rev-parse HEAD"));

        return latestCommit == this.currentCommitSign;
    };
}
