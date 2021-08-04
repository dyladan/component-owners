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
const core = require("@actions/core");
const github = require("@actions/github");
const utils_1 = require("./utils");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = github.getOctokit(core.getInput('repo-token', { required: true }));
        const ownerFilePath = core.getInput('component-owners-file', { required: true });
        const { base, head } = utils_1.getRefs();
        const config = yield utils_1.getConfig(client, base, ownerFilePath);
        const changedFiles = yield utils_1.getChangedFiles(client, base, head);
        const owners = yield utils_1.getOwners(config, changedFiles);
        core.info(`${owners.length} owners found`);
        core.info(owners.join("\n"));
        if (owners.length > 0) {
            const addAssigneesResult = yield client.rest.issues.addAssignees({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                issue_number: github.context.issue.number,
                assignees: owners,
            });
            core.debug(JSON.stringify(addAssigneesResult));
            const requestReviewersResult = yield client.rest.pulls.requestReviewers({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                pull_number: github.context.issue.number,
                reviewers: owners,
            });
            core.debug(JSON.stringify(requestReviewersResult));
        }
    });
}
main().catch(err => {
    core.debug(err.toString());
    core.setFailed(err.message);
});
//# sourceMappingURL=index.js.map