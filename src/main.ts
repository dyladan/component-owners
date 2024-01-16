import { strict as assert } from 'assert';
import * as util from 'util';

import * as core from '@actions/core';
import * as github from '@actions/github';
import { validateConfig } from './models/config';
import { getChangedFiles, getOwners, getPullAuthor, getRefs, getReviewers, getReviews, loadYaml } from './utils';

async function main() {
    const client = github.getOctokit(core.getInput('repo-token', { required: true }));
    const ownerFilePath = core.getInput('config-file', { required: true });
    const assignOwners = core.getBooleanInput('assign-owners', { required: true })
    const requestOwnerReviews = core.getBooleanInput('request-owner-reviews', { required: true })

    const { base, head } = getRefs();

    core.debug(`Base commit: ${base}`);
    core.debug(`Head commit: ${head}`);

    const configFile = await loadYaml(client, head, ownerFilePath);
    const config = validateConfig(configFile);

    const author = await getPullAuthor(client);

    if (config.ignoredAuthors.has(author)) {
        return;
    }

    const changedFiles = await getChangedFiles(client, base, head);
    const owners = getOwners(config, changedFiles);

    core.info(`${owners.length} owners found ${owners.join(' ')}`);

    let owner_teams = new Set<string>();
    let owner_users = new Set<string>();

    owners.forEach(owner => {
        if(owner.startsWith("/")) {
            owner_teams.add(owner.slice(1));
        } else {
            owner_users.add(owner);
        }
    })

    if (assignOwners && owners.length > 0) {
        core.info('Adding assignees');
        const addAssigneesResult = await client.rest.issues.addAssignees({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: github.context.issue.number,
            assignees: Array.from(owner_users),
        });
        core.debug(util.inspect(addAssigneesResult));
    }

    if (owner_users.has(author) || owner_users.has(author.toLowerCase())) core.info('PR author is a component owner');
    owner_users.delete(author);
    owner_users.delete(author.toLowerCase());

    // Do not want to re-request when reviewers have already been requested
    const oldReviewers = await getReviewers(client);

    for (const reviewer of oldReviewers.users) {
        if (!reviewer) continue;
        core.info(`${reviewer.login} has already been requested`);
        owner_users.delete(reviewer.login);
    }

    for (const reviewerTeam of oldReviewers.teams) {
        if (!reviewerTeam) continue;
        core.info(`${reviewerTeam.slug} team has already been requested`);
        owner_teams.delete(reviewerTeam.slug);
    }

    // Do not want to re-request when reviewers have already approved/rejected
    const previousReviews = await getReviews(client);
    for (const review of previousReviews) {
        if (!review.user) continue;
        if (!owner_users.has(review.user.login)) continue;
        core.info(`${review.user.login} has already reviewed`);
        owner_users.delete(review.user.login);
    }

    if (requestOwnerReviews && (owner_users.size > 0 || owner_teams.size > 0)) {
        core.info('Adding reviewers');
        const requestReviewersResult = await client.rest.pulls.requestReviewers({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: github.context.issue.number,
            reviewers: Array.from(owner_users),
            team_reviewers: Array.from(owner_teams),
        }).catch((err) => {
            // Ignore the case when the owner is not a collaborator.
            // Happens in forks and when the user hasn't yet received a write bit on the repo.
            assert(err.message?.includes?.('Reviews may only be requested from collaborators'), err);
            core.info(`Ignoring error: ${util.inspect(err)}`);
            return err;
        });
        core.debug(util.inspect(requestReviewersResult));
    }
}

main().catch(err => {
    core.debug(util.inspect(err));
    core.setFailed(err.message);
});
