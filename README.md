# auto-assign-owners

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
name: 'Auto Assign'
on:
  pull_request:

jobs:
  run_self:
    runs-on: ubuntu-latest
    name: Auto Assign Owners
    steps:
      - name: Auto Assign Reviewers
        uses: dyladan/auto-assign-owners
        with:
          config-file: ".github/some_name_for_configs.yml" # Only needed if you use something other than .github/component_owners.yml
          repo-token: ${{ github.token }}
```
