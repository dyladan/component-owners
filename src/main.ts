import * as core from "@actions/core";
import * as github from "@actions/github";
import { getChangedFiles, getConfig, getOwners, getPullAuthor, getRefs } from "./utils";

async function main() {
    const client = github.getOctokit(core.getInput('repo-token', { required: true }));
    const ownerFilePath = core.getInput('config-file', { required: true });

    const { base, head } = getRefs();

    const config = await getConfig(client, head, ownerFilePath);

    const changedFiles = await getChangedFiles(client, base, head);
    const owners = await getOwners(config, changedFiles);
 
    core.info(`${owners.length} owners found ${owners.join(" ")}`);

    if (owners.length > 0) {
        const addAssigneesResult = await client.rest.issues.addAssignees({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: github.context.issue.number,
            assignees: owners,
        });
        core.debug(JSON.stringify(addAssigneesResult));
    }

    const author = await getPullAuthor(client);
    const reviewers = owners.filter(o => o !== author)

    if (reviewers.length > 0) {
        const requestReviewersResult = await client.rest.pulls.requestReviewers({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: github.context.issue.number,
            reviewers,
        });
        core.debug(JSON.stringify(requestReviewersResult));
    }
}

main().catch(err => {
    core.debug(err.toString());
    core.setFailed(err.message);
});
