import * as core from "@actions/core";
import * as github from "@actions/github";
import { getChangedFiles, getConfig, getOwners, getPullAuthor, getRefs } from "./utils";

async function main() {
    const client = github.getOctokit(core.getInput('repo-token', { required: true }));
    const ownerFilePath = core.getInput('config-file', { required: true });
    const assignOwners = core.getBooleanInput('assign-owners', { required: true })
    const requestOwnerReviews = core.getBooleanInput('request-owner-reviews', { required: true })

    const { base, head } = getRefs();

    // Log the base and head commits
    core.info(`Base commit: ${base}`)
    core.info(`Head commit: ${head}`)

    const config = await getConfig(client, head, ownerFilePath);

    const changedFiles = await getChangedFiles(client, base, head);
    const owners = await getOwners(config, changedFiles);


    core.info(`${owners.length} owners found ${owners.join(" ")}`);

    if (assignOwners && owners.length > 0) {
        core.info("Adding assignees");
        const addAssigneesResult = await client.rest.issues.addAssignees({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: github.context.issue.number,
            assignees: owners,
        });
        core.debug(JSON.stringify(addAssigneesResult));
    }

    const author = await getPullAuthor(client);

    const reviewers = []
    for (const owner of owners) {
        if (owner === author) {
            core.info("PR author is a component owner");
            continue;
        }

        reviewers.push(owner);
    }

    if (requestOwnerReviews && reviewers.length > 0) {
        core.info("Adding reviewers");
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
