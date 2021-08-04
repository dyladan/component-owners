"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = exports.getChangedFiles = exports.getRefs = exports.getOwners = void 0;
const core = require("@actions/core");
const github = require("@actions/github");
const yaml = require("js-yaml");
function getOwners(config, changedFiles) {
    return __awaiter(this, void 0, void 0, function* () {
        const components = config.components;
        const owners = new Set();
        for (const file of changedFiles) {
            for (const ownedPath of Object.keys(components)) {
                if (file.filename.startsWith(ownedPath)) {
                    const pathOwners = components[ownedPath];
                    if (typeof pathOwners === "string") {
                        owners.add(pathOwners);
                    }
                    else {
                        for (const owner of pathOwners) {
                            owners.add(owner);
                        }
                    }
                }
            }
        }
        return Array.from(owners);
    });
}
exports.getOwners = getOwners;
function getRefs() {
    var _a, _b, _c, _d;
    // Get event name.
    const eventName = github.context.eventName;
    // Define the base and head commits to be extracted from the payload.
    let base;
    let head;
    switch (eventName) {
        case 'pull_request':
            base = (_b = (_a = github.context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.base) === null || _b === void 0 ? void 0 : _b.sha;
            head = (_d = (_c = github.context.payload.pull_request) === null || _c === void 0 ? void 0 : _c.head) === null || _d === void 0 ? void 0 : _d.sha;
            break;
        case 'push':
            base = github.context.payload.before;
            head = github.context.payload.after;
            break;
        default:
            throw new Error(`This action only supports pull requests and pushes, ${github.context.eventName} events are not supported. ` +
                "Please submit an issue on this action's GitHub repo if you believe this in correct.");
    }
    // Log the base and head commits
    core.info(`Base commit: ${base}`);
    core.info(`Head commit: ${head}`);
    // Ensure that the base and head properties are set on the payload.
    if (!base || !head) {
        throw new Error(`The base and head commits are missing from the payload for this ${github.context.eventName} event. ` +
            "Please submit an issue on this action's GitHub repo.");
    }
    return { base, head };
}
exports.getRefs = getRefs;
function getChangedFiles(client, base, head) {
    return __awaiter(this, void 0, void 0, function* () {
        // Use GitHub's compare two commits API.
        // https://developer.github.com/v3/repos/commits/#compare-two-commits
        const compareResponse = yield client.rest.repos.compareCommits({
            base,
            head,
            owner: github.context.repo.owner,
            repo: github.context.repo.repo
        });
        // Ensure that the request was successful.
        if (compareResponse.status !== 200) {
            throw new Error(`The GitHub API for comparing the base and head commits for this ${github.context.eventName} event returned ${compareResponse.status}, expected 200. ` +
                "Please submit an issue on this action's GitHub repo.");
        }
        // Ensure that the head commit is ahead of the base commit.
        if (compareResponse.data.status !== 'ahead') {
            throw new Error(`The head commit for this ${github.context.eventName} event is not ahead of the base commit. ` +
                "Please submit an issue on this action's GitHub repo.");
        }
        const changedFiles = compareResponse.data.files;
        if (!changedFiles) {
            throw new Error(`The head commit for this ${github.context.eventName} event is not ahead of the base commit. ` +
                "Please submit an issue on this action's GitHub repo.");
        }
        return changedFiles;
    });
}
exports.getChangedFiles = getChangedFiles;
function getConfig(client, ref, location) {
    return __awaiter(this, void 0, void 0, function* () {
        const contents = yield getFileContents(client, ref, location);
        return yaml.load(contents, { filename: location });
    });
}
exports.getConfig = getConfig;
function getFileContents(client, ref, location) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield client.rest.repos.getContent({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            path: location,
            ref,
        });
        // Ensure that the request was successful.
        if (result.status !== 200) {
            throw new Error(`getFileContents failed ${result.status} ${ref.slice(0, 7)} ${location}`);
        }
        const data = result.data;
        if (!data.content) {
            throw new Error(`getFileContents no content ${ref.slice(0, 7)} ${location}`);
        }
        return Buffer.from(data.content, 'base64').toString();
    });
}
//# sourceMappingURL=utils.js.map