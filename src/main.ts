import * as core from "@actions/core";
import * as github from "@actions/github";
import { getChangedFiles, getConfig, getOwners, getPullAuthor, getRefs, getReviewers, getReviews } from "./utils";

async function main() {
    const client = github.getOctokit(core.getInput('repo-token', { required: true }));
    const ownerFilePath = core.getInput('config-file', { required: true });
    const assignOwners = core.getBooleanInput('assign-owners', { required: true })
    const requestOwnerReviews = core.getBooleanInput('request-owner-reviews', { required: true })

    const { base, head } = getRefs();

    core.debug(`Base commit: ${base}`)
    core.debug(`Head commit: ${head}`)

    const config = await getConfig(client, head, ownerFilePath);

    const changedFiles = await getChangedFiles(client, base, head);
    const owners = getOwners(config, changedFiles);

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

    const reviewers = new Set<string>(owners);
    if (reviewers.has(author)) core.info("PR author is a component owner");
    reviewers.delete(author);

    // Do not want to re-request when reviewers have already been requested
    const oldReviewers = await getReviewers(client);
    for (const reviewer of oldReviewers) {
        if (!reviewer) continue;
        core.info(`${reviewer.login} has already been requested`);
        reviewers.delete(reviewer.login);
    }

    // Do not want to re-request when reviewers have already approved/rejected
    const previousReviews = await getReviews(client);
    for (const review of previousReviews) {
        if (!review.user) continue;
        if (!reviewers.has(review.user.login)) continue;
        core.info(`${review.user.login} has already reviewed`);
        reviewers.delete(review.user.login);
    }

    if (requestOwnerReviews && reviewers.size > 0) {
        core.info("Adding reviewers");
        const requestReviewersResult = await client.rest.pulls.requestReviewers({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: github.context.issue.number,
            reviewers: Array.from(reviewers),
        });
        core.debug(JSON.stringify(requestReviewersResult));
    }
}

main().catch(err => {
    core.debug(err.toString());
    core.setFailed(err.message);
});
