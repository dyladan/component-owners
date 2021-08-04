import * as core from "@actions/core";
import * as github from "@actions/github";
import { getChangedFiles, getConfig, getOwners, getRefs } from "./utils";


async function main() {
    const client = github.getOctokit(core.getInput('repo-token', { required: true }));
    const ownerFilePath = core.getInput('config-file', { required: true });

    const { base, head } = getRefs();

    const config = await getConfig(client, base, ownerFilePath);

    const changedFiles = await getChangedFiles(client, base, head);
    const owners = await getOwners(config, changedFiles);
 
    core.info(`${owners.length} owners found`);
    core.info(owners.join("\n"));

    if (owners.length > 0) {
        core.info("Adding assignees");
        const addAssigneesResult = await client.rest.issues.addAssignees({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: github.context.issue.number,
            assignees: owners,
        });
        core.debug(JSON.stringify(addAssigneesResult));
        core.info("Adding done");
    }
}

main().catch(err => {
    core.debug(err.toString());
    core.setFailed(err.message);
});
