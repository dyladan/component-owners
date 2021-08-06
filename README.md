# component-owners

Automatically assign and add approvers to component owners of lerna monorepos.

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
```

Next, create your github action yml.

```yaml
name: 'Component Owners'
on:
  pull_request:

jobs:
  run_self:
    runs-on: ubuntu-latest
    name: Auto Assign Owners
    steps:
      - uses: dyladan/component-owners
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
