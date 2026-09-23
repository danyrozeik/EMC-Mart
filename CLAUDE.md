# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repository is a collection of static, standalone HTML/CSS/JS tools and pages — there is no build system, package manager, bundler, or test suite. Each tool is self-contained and can be opened directly in a browser or served as static files.

- `index.html` — project index/landing page linking to the tools below.
- `esu-pad-supplier-matrix.html` — a single-file tool for electrosurgical return-electrode pad manufacturing: raw material sourcing comparison and landed unit-cost (BOM) rollup, including freight/duty adjustments.
- `stack-drop/` — a Tetris-style browser game (`index.html` + `script.js` + `style.css`) with hold piece, touch controls, and high-score persistence (via browser storage).
- `README.md` — usage instructions for the push script below.
- `push_emc_mart_appbridge_to_github.sh` — a bash utility (not app source) for publishing this repo as a GitHub template repo and/or creating new repos from that template.

When adding a new tool, follow the existing pattern: a self-contained HTML file (or subdirectory with its own `index.html`/`script.js`/`style.css`), linked from `index.html`. There is no shared build step, so each page must work standalone when opened directly.

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
