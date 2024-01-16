import * as github from "@actions/github";
import * as yaml from "js-yaml";
import * as path from "path";
import type { Config } from "./models/config";
import type { ChangedFile, Client } from "./types";

export async function getPullAuthor(client: Client) {
    const result = await client.rest.pulls.get({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: github.context.issue.number,
    });

    if (result.status !== 200) {
        throw new Error(
            `getPullAuthor failed #${github.context.issue.number} ${result.status}`
        );
    }

    const login = result.data.user?.login;

    if (!login) {
        throw new Error(
            `getPullAuthor user has no login #${github.context.issue.number}`
        );
    }

    return login;
}

export function getOwners(config: Config, changedFiles: ChangedFile[]) {
    const components = config.components;
    const owners = new Set<string>();

    for (const file of changedFiles) {
        for (const ownedPath of Object.keys(components)) {
            if (match(file.filename, ownedPath)) {
                for (const owner of components[ownedPath]) {
                    if (owner == "") continue;
                    owners.add(owner.trim());
                }
            }
        }
    }

    return Array.from(owners);
}

function match(name: string, ownedPath: string): boolean {
    // special case for root
    if (ownedPath === "/") return true;

    // Remove leading and trailing path separator
    ownedPath = ownedPath.replace(/^\//, "").replace(/\/$/, "");

    if (ownedPath.startsWith("*.")) {
      const extension = ownedPath.substring(1)
      return name.endsWith(extension)
    }

    const ownedPathParts = ownedPath.split(path.sep);
    const filePathParts = name.split(path.sep).slice(0, ownedPathParts.length);

    return ownedPathParts.join(path.sep) === filePathParts.join(path.sep);
}

export function getRefs() {
    // Get event name.
    const eventName = github.context.eventName

    // Define the base and head commits to be extracted from the payload.
    let base: string | undefined
    let head: string | undefined

    switch (eventName) {
        case 'pull_request':
        case 'pull_request_target':
            base = github.context.payload.pull_request?.base?.sha
            head = github.context.payload.pull_request?.head?.sha
            break
        case 'push':
            base = github.context.payload.before
            head = github.context.payload.after
            break
        default:
            throw new Error(
                `This action only supports pull requests and pushes, ${github.context.eventName} events are not supported. ` +
                "Please submit an issue on this action's GitHub repo if you believe this in correct."
            )
    }

    // Ensure that the base and head properties are set on the payload.
    if (!base || !head) {
        throw new Error(
            `The base and head commits are missing from the payload for this ${github.context.eventName} event. ` +
            "Please submit an issue on this action's GitHub repo."
        )

    }

    return { base, head }
}

export async function getChangedFiles(client: Client, base: string, head: string): Promise<ChangedFile[]> {
    // Use GitHub's compare two commits API.
    // https://developer.github.com/v3/repos/commits/#compare-two-commits
    const compareResponse = await client.rest.repos.compareCommits({
        base,
        head,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo
    })

    // Ensure that the request was successful.
    if (compareResponse.status !== 200) {
        throw new Error(
            `The GitHub API for comparing the base and head commits for this ${github.context.eventName} event returned ${compareResponse.status}, expected 200. ` +
            "Please submit an issue on this action's GitHub repo."
        )
    }

    const changedFiles = compareResponse.data.files;

    if (!changedFiles) {
        throw new Error(
            `The head commit for this ${github.context.eventName} event is not ahead of the base commit. ` +
            "Please submit an issue on this action's GitHub repo."
        )
    }

    return changedFiles;
}

export async function getReviewers(client: Client) {
    const result = await client.rest.pulls.listRequestedReviewers({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: github.context.issue.number,
    });

    // Ensure that the request was successful.
    if (result.status !== 200) {
        throw new Error(
            `getReviewers failed ${result.status} ${github.context.issue.number}`
        );
    }

    return result.data;
}

export async function getReviews(client: Client) {
    const result = await client.rest.pulls.listReviews({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: github.context.issue.number,
    });

    // Ensure that the request was successful.
    if (result.status !== 200) {
        throw new Error(
            `getReviews failed ${result.status} ${github.context.issue.number}`
        );
    }

    return result.data;
}

async function getFileContents(client: Client, ref: string, location: string): Promise<string> {
    const result = await client.rest.repos.getContent({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        path: location,
        ref,
    });

    // Ensure that the request was successful.
    if (result.status !== 200) {
        throw new Error(
            `getFileContents failed ${result.status} ${ref.slice(0, 7)} ${location}`
        );
    }

    const data: any = result.data

    if (!data.content) {
        throw new Error(
            `getFileContents no content ${ref.slice(0, 7)} ${location}`
        );
    }

    return Buffer.from(data.content, 'base64').toString();
}

export async function loadYaml(client: Client, ref: string, location: string): Promise<unknown> {
    try {
        const contents = await getFileContents(client, ref, location);
        return yaml.load(contents, { filename: location });
    } catch (err) {
        throw new Error(`Failed to load configuration ${ref.slice(0, 7)} ${err.message} ${location}`)
    }
}
