# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repository currently contains no application code. It holds only:

- `README.md` — usage instructions for the push script below.
- `push_emc_mart_appbridge_to_github.sh` — a bash utility (not app source) for publishing this scaffold as a GitHub template repo and/or creating new repos from that template.

There is no build system, package manifest, linter config, or test suite yet. When application code is added to this repo, this file should be updated to document its structure, build/lint/test commands, and architecture.

## `push_emc_mart_appbridge_to_github.sh`

Publishes the current directory to GitHub as a template repo, and/or creates a new repository from a template, via the `gh` CLI. Requires `gh` and `git` on PATH, with `gh auth login` already done.

```bash
chmod +x push_emc_mart_appbridge_to_github.sh

# Preview actions without making changes
./push_emc_mart_appbridge_to_github.sh --template --template-owner Danyrozeik --template-repo emc-mart-appbridge-template --dry-run

# Publish this scaffold as a public template repo
./push_emc_mart_appbridge_to_github.sh --template --template-owner Danyrozeik --template-repo emc-mart-appbridge-template

# Create a new (private by default) repo from the template
./push_emc_mart_appbridge_to_github.sh --template --template-owner Danyrozeik --template-repo emc-mart-appbridge-template --new-repo-name my-emc-app --new-owner Danyrozeik --private
```

Key flags: `--template` (publish as template), `--template-owner`/`--template-repo` (target template repo, default `Danyrozeik/emc-mart-appbridge-template`), `--org-owner` (default owner for both template and new repo), `--new-repo-name`/`--new-owner` (create a repo from the template), `--private`/`--public` (visibility of the new repo, default private), `--dry-run`, `--help`.
