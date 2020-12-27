import { getOctokit } from '@actions/github'

export function getMergeCommits(commits: any[]) {
  const mergeCommits: Array<{ commit: any; branch: string }> = []
  commits.forEach((commit) => {
    const reg = /^Merge branch '(.*)' into .*$/
    const res = reg.exec(commit.message)
    if (res != null) {
      mergeCommits.push({ commit, branch: res[1] })
    }
  })

  return mergeCommits
}

export async function getBranchOpenPRs({
  repo,
  owner,
  branch,
  client,
}: {
  repo: string
  owner: string
  branch: string
  client: ReturnType<typeof getOctokit>
}) {
  const { data } = await client.pulls.list({ repo, owner, state: 'open', head: `${owner}:${branch}` })
  return data
}
