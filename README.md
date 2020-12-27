## Label PR on merge

Github actions for watching PRs merged into a given branch (e.g., 'beta'). When a PR is merged it's labeled with the given `merged-label-name`,
helping to keep track of PRs that are in beta for example. If a push occurs into the PR's branch and it was already labeled with the `merged-label-name`, it will label the PR now with the `stale-merged-label-name`, meaning that the PR was merged into, for example,
`beta`, but now an older version is merged there.
