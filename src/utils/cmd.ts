import { exec } from "child_process";

const runCmd = (cmd: string) =>
    new Promise<string>((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) return reject("Error running command " + error);
            const result = (stdout + " " + stderr).trim();
            resolve(result);
        });
    });

export default runCmd;
