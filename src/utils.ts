import * as core from "@actions/core";
import * as github from "@actions/github";
import * as yaml from "js-yaml";
import * as path from "path";
import { ChangedFile, Client, Config } from "./types";

export async function getCollaboratorLogins(client: Client) {
    const result = await client.rest.repos.listCollaborators({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
    });

    if (result.status !== 200) {
        throw new Error(
            `listCollaborators failed #${github.context.issue.number} ${result.status}`
        );
    }

    return new Set(result.data.map(d => d.login));
}

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

export async function getOwners(config: Config, changedFiles: ChangedFile[]) {
    const components = config.components;
    const owners = new Set<string>();

    for (const file of changedFiles) {
        for (const ownedPath of Object.keys(components)) {
            if (match(file.filename, ownedPath)) {
                let pathOwners = ensureList(components[ownedPath]);

                for (const owner of pathOwners) {
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
 
    const ownedPathParts = ownedPath.split(path.sep);
    const filePathParts = name.split(path.sep).slice(0, ownedPathParts.length);

    return ownedPathParts.join(path.sep) === filePathParts.join(path.sep);
}

function ensureList(inp?: string | string[]): string[] {
    if (typeof inp === "string") {
        return inp.split(/\s+/);
    }
    return inp ?? [];
}

export function getRefs() {
    // Get event name.
    const eventName = github.context.eventName

    // Define the base and head commits to be extracted from the payload.
    let base: string | undefined
    let head: string | undefined

    switch (eventName) {
        case 'pull_request':
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

    // Ensure that the head commit is ahead of the base commit.
    if (compareResponse.data.status !== 'ahead') {
        throw new Error(
            `The head commit for this ${github.context.eventName} event is not ahead of the base commit. ` +
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


export async function getConfig(client: Client, ref: string, location: string): Promise<Config> {
    try {
        const contents = await getFileContents(client, ref, location);
        return yaml.load(contents, { filename: location }) as any;
    } catch (err) {
        throw new Error(`Failed to get configuration ${ref.slice(0, 7)} ${err.message} ${location}`)
    }
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