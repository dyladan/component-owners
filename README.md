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

  # You also can assign ownership for a team (https://docs.github.com/en/organizations/organizing-members-into-teams/about-teams)
  src/example.ts: org-name/team-name

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

permissions:
  contents: read          # to read changed files
  issues: write           # to read/write issue assignees
  pull-requests: write    # to read/write PR reviewers

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

**You must [generate your own access token](#using-own-access-token) if you plan to use it for teams ownership**, otherwise the default `github.token` is typically sufficient.

### `assign-owners`

**default**: `true`

Determines if the component owners should be added to the pull request as assignees.

### `request-owner-reviews`

**default**: `true`

Determines pull request reviews should be requested from component owners.

## Using own access token

If you want to use this action to assign reviews for teams, then `github.token` would not be sufficient and you need to generate a new one. 

1. Just follow [Github's instructions](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token) and add a new token with the following set of permissions:

| Permissions | Access |
| --- | --- |
Actions | Read-only
Codespaces | Read-only
Commit statuses | Read-only
Contents | Read-only
Environments | Read-only
Issues | Read and write
Metadata | Read-only
Pull requests | Read and write

2. Create a [secret for your repository](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository), and place your token inside. Name it, for example, ``CODEOWNER_SECRET``.

3. Use the newly created secret as the token in the action yml file:

```
          # default: ${{ github.token }}
          repo-token: ${{ secrets.CODEOWNER_SECRET }}
```

## Why not use CODEOWNERS?

Great question.
If all of your contributors have write access to your repo, CODEOWNERS is a great solution.
If, like many open source projects, you would like to assign some ownership of a single component of your repository, but you don't want to grant those component owners write access to the repo, this action can help.
