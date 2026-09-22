#!/usr/bin/env bash
set -euo pipefail

# EMC Mart AppBridge - Push scaffold to GitHub as template (and/or clone from template)
# Defaults (you can override)
DEFAULT_TEMPLATE_OWNER="Danyrozeik"
DEFAULT_TEMPLATE_REPO="emc-mart-appbridge-template"

print_usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  --template
    Publish the current scaffold as a public template repo.

  --template-owner OWNER
  --template-repo REPO
    Owner and repository name for the template. Defaults:
      template-owner: ${DEFAULT_TEMPLATE_OWNER}
      template-repo: ${DEFAULT_TEMPLATE_REPO}

  --org-owner ORG
    GitHub organization login to use as default owner for template and new repos
    (e.g., emc-mart). If omitted, you can still specify --template-owner/--new-owner.

  --new-repo-name NAME
  --new-owner OWNER
    Create a new repository from the template. If NEW_OWNER is omitted, defaults to TEMPLATE_OWNER.
    Optional --private (default) or --public to set visibility.

  --private
  --public
    Visibility for the NEW repository (used when --new-repo-name is provided).

  --dry-run
    Print actions without executing them.

  --help
    Show this help message.
EOF
}

# Argument state (defaults)
TEMPLATE=false
TEMPLATE_OWNER_SET=false
TEMPLATE_OWNER="${DEFAULT_TEMPLATE_OWNER}"
TEMPLATE_REPO="${DEFAULT_TEMPLATE_REPO}"
# TEMPLATE_OWNER_FLAG removed (unused)
ORG_OWNER=""
NEW_REPO_NAME=""
NEW_OWNER_SET=false
NEW_OWNER=""
NEW_REPO_PRIVATE=true
DRY_RUN=false
SHOW_HELP=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --template)
      TEMPLATE=true
      shift
      ;;
    --template-owner)
      TEMPLATE_OWNER="$2"; TEMPLATE_OWNER_SET=true; shift 2
      ;;
    --template-repo)
      TEMPLATE_REPO="$2"; shift 2
      ;;
    --org-owner)
      ORG_OWNER="$2"; shift 2
      ;;
    --new-repo-name)
      NEW_REPO_NAME="$2"; shift 2
      ;;
    --new-owner)
      NEW_OWNER="$2"; NEW_OWNER_SET=true; shift 2
      ;;
    --private)
      NEW_REPO_PRIVATE=true; shift
      ;;
    --public)
      NEW_REPO_PRIVATE=false; shift
      ;;
    --dry-run)
      DRY_RUN=true; shift
      ;;
    --help)
      SHOW_HELP=true; shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      SHOW_HELP=true
      shift
      ;;
  esac
done

if $SHOW_HELP; then
  print_usage
  exit 0
fi

# Prereqs
command -v gh >/dev/null 2>&1 || { echo "gh (GitHub CLI) is required but not installed. Install and authenticate with gh auth login." >&2; exit 1; }
command -v git >/dev/null 2>&1 || { echo "git is required but not installed." >&2; exit 1; }

# If ORG_OWNER provided, apply as defaults for TEMPLATE_OWNER and NEW_OWNER when not explicitly set
if [[ -n "$ORG_OWNER" ]]; then
  if ! $TEMPLATE_OWNER_SET; then TEMPLATE_OWNER="$ORG_OWNER"; fi
  if ! $NEW_OWNER_SET; then NEW_OWNER="$ORG_OWNER"; fi
fi

# Ensure we're in a git repo; if not, initialize
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Initializing a new git repo in the current directory..."
  git init
  git add .
  git -c color.ui=never commit -m "EMC Mart AppBridge scaffold: initial commit"
fi

# Optional: show a quick summary (dry-run mode)
if $DRY_RUN; then
  echo "DRY-RUN: template owner=${TEMPLATE_OWNER}, template-repo=${TEMPLATE_REPO}"
  if [[ -n "$NEW_REPO_NAME" ]]; then
    NEW_OWNER_FINAL="${NEW_OWNER:-$TEMPLATE_OWNER}"
    echo "DRY-RUN: new repo -> ${NEW_OWNER_FINAL}/${NEW_REPO_NAME}"
  fi
fi

########################################
# Actions (extracted into functions)
########################################

publish_template() {
  # Publishes the current directory as a public template repo named "${TEMPLATE_OWNER}/${TEMPLATE_REPO}"
  local local_template_full="${TEMPLATE_OWNER}/${TEMPLATE_REPO}"

  echo "Publishing template repo: ${local_template_full}"

  if $DRY_RUN; then
    echo "DRY-RUN: gh repo create ${local_template_full} --public --source=. --remote=origin -y"
  else
    gh repo create "$local_template_full" --public --source=. --remote=origin -y
  fi

  if $DRY_RUN; then
    echo "DRY-RUN: gh api -X PATCH /repos/${local_template_full} -f is_template=true"
  else
    gh api -X PATCH "/repos/${local_template_full}" -f is_template=true >/dev/null 2>&1 || \
      gh api -X PATCH "repos/${local_template_full}" -f is_template=true
  fi

  echo "Template published: https://github.com/${local_template_full}"
}

create_repo_from_template() {
  # Creates a new repository from the specified template.
  if [[ -z "$TEMPLATE_OWNER" || -z "$TEMPLATE_REPO" ]]; then
    echo "To create from a template, you must specify --template-owner and --template-repo." >&2
    exit 1
  fi

  local new_owner_final="${NEW_OWNER:-$TEMPLATE_OWNER}"
  local new_repo_full="${new_owner_final}/${NEW_REPO_NAME}"
  local repo_flag

  if $NEW_REPO_PRIVATE; then
    repo_flag="--private"
  else
    repo_flag="--public"
  fi

  if $DRY_RUN; then
    echo "DRY-RUN: gh repo create ${new_repo_full} ${repo_flag} --template ${TEMPLATE_OWNER}/${TEMPLATE_REPO} -y"
  else
    gh repo create "$new_repo_full" $repo_flag --template "$TEMPLATE_OWNER/$TEMPLATE_REPO" -y
  fi

  echo "New repo created: https://github.com/${new_repo_full}"
}

# Run actions based on flags
if $TEMPLATE; then
  publish_template
fi

if [[ -n "$NEW_REPO_NAME" ]]; then
  create_repo_from_template
fi

echo "Done. Exiting."
exit 0
