# component-owners

Automatically add component owners as assignees and approvers to pull requests.

This works very similarly to CODEOWNERS, however with CODEOWNERS all owners must have write access to the repository.
Many open source projects wish to assign some level of ownership of individual components, but are hesitant to grant write access to those owners.
This action only requires that component owners be collaborators on the repository or members of the organization, but does NOT require they have write access.

## Getting Started

First, create a configuration file.
By default, the action will look in `.github/component_owners.yml`.

```yaml
# .github/component_owners.yml

# Each component identified by its path prefix has a list of owners
components:
  # Ownership applies recursively to any file in a directory
  src/:
    - owner1 # owner1 owns all files in src/

  # Ownership can be assigned as a string
  src/index.ts: owner2 owner3
  
  # or a list
  src/list-owners.ts:
    - owner3
    - owner4

  # Ownership can be assigned based on a file extension
  "*.md":
    - owner5

# Optionally ignore some PR authors to reduce spam for your component owners
ignored-authors:
  - dependabot
  - renovate-bot
```

Next, create your github action yml.

```yaml
name: 'Component Owners'
on:
  # pull_request_target is suggested for projects where pull requests will be
  # made from forked repositories. If pull_request is used in these cases,
  # the github token will not have sufficient permission to update the PR.
  pull_request_target:

jobs:
  run_self:
    runs-on: ubuntu-latest
    name: Auto Assign Owners
    steps:
      - uses: dyladan/component-owners@main
        with:
          # default: .github/component_owners.yml
          config-file: .github/component_owners.yml
          # default: ${{ github.token }}
          repo-token: ${{ github.token }} 
          # default: true
          assign-owners: "true"
          # default: true
          request-owner-reviews: "true"
```

## Configuration

### `config-file`

**default**: `.github/component_owners.yml`

Path to configuration file.

### `repo-token`

**default**: `${{ github.token }}`

GitHub personal access token.
Must have permission to read and write pull requests.
The default `github.token` is typically sufficient.

### `assign-owners`

**default**: `true`

Determines if the component owners should be added to the pull request as assignees.

### `request-owner-reviews`

**default**: `true`

Determines pull request reviews should be requested from component owners.

## Why not use CODEOWNERS?

Great question.
If all of your contributors have write access to your repo, CODEOWNERS is a great solution.
If, like many open source projects, you would like to assign some ownership of a single component of your repository, but you don't want to grant those component owners write access to the repo, this action can help.
