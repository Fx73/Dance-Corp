#!/usr/bin/env bash
# Commits package.json and package-lock.json to a branch through the GitHub API, and prints the new commit sha.
# API commits made with GITHUB_TOKEN are signed by GitHub, and do not trigger other workflows.
# Usage: commit-version.sh <branch> <expected head sha>
set -euo pipefail

BRANCH="$1"
EXPECTED_HEAD="$2"
VERSION=$(node -p "require('./package.json').version")

node -e '
const fs = require("fs")
const [repo, branch, head, version] = process.argv.slice(1)
const file = path => ({ path, contents: fs.readFileSync(path).toString("base64") })
process.stdout.write(JSON.stringify({
  query: "mutation($input: CreateCommitOnBranchInput!) { createCommitOnBranch(input: $input) { commit { oid } } }",
  variables: { input: {
    branch: { repositoryNameWithOwner: repo, branchName: branch },
    message: { headline: `Bump version to ${version}` },
    expectedHeadOid: head,
    fileChanges: { additions: [file("package.json"), file("package-lock.json")] },
  } },
}))
' "$GITHUB_REPOSITORY" "$BRANCH" "$EXPECTED_HEAD" "$VERSION" \
  | gh api graphql --input - --jq '.data.createCommitOnBranch.commit.oid'
