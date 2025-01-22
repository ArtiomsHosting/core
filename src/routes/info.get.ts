import UpdateManager from "~/managers/UpdateManager";
import runCmd from "~/utils/cmd";
import { ApiHandler } from "~/utils/types";

export const handler: ApiHandler = async (req, res, next) => {
    const pjson = UpdateManager.getProjectPackageJSON();
    const commit = await UpdateManager.getCurrentCommit().catch(
        () => undefined
    );

    res.send({
        name: pjson.name,
        version: pjson.version,
        commit_name: commit?.commit_name,
        commit_hash: commit?.hash,
        author: pjson.author,
        npm_version: await runCmd("npm --version"),
        node_version: await runCmd("node --version"),
        repository: pjson.repository.url,
    });
};
