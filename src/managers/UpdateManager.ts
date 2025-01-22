import { UpdateManagerParams } from "~/utils/types";
import axios from "axios";
import runCmd from "~/utils/cmd";
import tryCatch from "~/utils/tryCatch";

export default class UpdateManager {
    repository: string;
    branch: string;
    updateCheckInterval: number;
    updateDeps: boolean;
    remoteName: string;
    currentCommitSign: string | undefined;

    constructor(params: UpdateManagerParams) {
        this.repository = params.repository;
        this.branch = params.branch || "main";
        this.remoteName = params.remoteName || "origin";
        this.updateCheckInterval = params.updateCheckInterval;
        this.updateDeps =
            params.updateDeps == undefined ? true : params.updateDeps;

        if (this.updateCheckInterval && params.autoUpdate) {
            setInterval(async () => {
                await tryCatch(this.update(console.log));
            }, this.updateCheckInterval);
        }
    }

    update = async (cb?: (m: string) => void) => {
        const [isUpToDate, error] = await tryCatch(this.isUpToDate());
        if (error) throw new Error(`Error fetching cloud signature. ${error}`);
        if (isUpToDate) return "Running up to date";
        if (cb) cb("New update detected. Installing...");

        const [updateData, error1] = await tryCatch(this.updateCode());
        if (error1) throw new Error(`Error pulling the code. ${error1}`);
        if (!updateData.includes("Updating")) return "Running up to date";
        if (cb) cb(updateData);
        if (cb) cb("Updated the source code. Updating dependencies...");

        if (this.updateDeps) {
            const [updateDeps, error2] = await tryCatch(
                this.updateDependencies()
            );
            if (error2)
                throw new Error(`Error updating dependencies. ${error2}`);
            if (cb) cb(updateDeps);
        }

        console.log("Successful Update. Exiting the program");
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
        try {
            await runCmd("git fetch");
            const diff = await runCmd(
                `git log HEAD..${this.remoteName}/${this.branch} --oneline`
            );

            return diff.trim() === "";
        } catch (err) {
            console.error("Error cecking if up to date", err);
            return true;
        }
    };
}
