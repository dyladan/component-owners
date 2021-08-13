# Assign Reviewers Action

Automatically add configured github users as assignees and approvers to pull requests.

This works very similarly to CODEOWNERS, however with CODEOWNERS all owners must have write access to the repository.
Many open source projects wish to assign some level of ownership of individual components, but are hesitant to grant write access to those owners.
This action only requires that assignees and reviewers be collaborators on the repository or members of the organization, but does NOT require they have write access.

## Getting Started

First, create a configuration file.
By default, the action will look in `.github/assign_reviewers.yml`.

```yaml
# .github/assign_reviewers.yml

# Each component identified by its path prefix has a list of users
components:
  # User assignment applies recursively to any file in a directory
  src/:
    - user1 # user1 owns all files in src/

  # User assignment can be configured as a space-separated string
  src/index.ts: user2 user3
  
  # or a list
  src/list-users.ts:
    - user3
    - user4

# Optionally ignore some PR authors to reduce spam for assignees and reviewers
ignored-authors:
  - dependabot
  - renovate-bot
```

Next, create your github action yml.

```yaml
name: 'Assign Reviewers'
on:
  # pull_request_target is suggested for projects where pull requests will be
  # made from forked repositories. If pull_request is used in these cases,
  # the github token will not have sufficient permission to update the PR.
  pull_request_target:

jobs:
  assign:
    runs-on: ubuntu-latest
    name: Assign Reviewers
    steps:
      - uses: open-telemetry/assign-reviewers-action@main
        with:
          # default: .github/assign_reviewers.yml
          config-file: .github/assign_reviewers.yml
          # default: ${{ github.token }}
          repo-token: ${{ github.token }} 
          # default: true
          assign-users: "true"
          # default: true
          request-user-reviews: "true"
```

## Configuration

### `config-file`

**default**: `.github/assign_reviewers.yml`

Path to configuration file.

### `repo-token`

**default**: `${{ github.token }}`

GitHub personal access token.
Must have permission to read and write pull requests.
The default `github.token` is typically sufficient.

### `assign-users`

**default**: `true`

Determines if the configured users for a component should be added to the pull request as assignees.

### `request-user-reviews`

**default**: `true`

Determines if pull request reviews should be requested from configured users for a component.

## Why not use CODEOWNERS?

If all of your contributors have write access to your repo, CODEOWNERS is a great solution.
If, like many open source projects, you would like to assign some level of ownership of a single component of your repository, but you don't want to grant those users write access to the repo, this action can help.
