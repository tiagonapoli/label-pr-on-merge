import { getOctokit } from '@actions/github'

import { getBranchOpenPRs } from './utils'

export class PRHelper {
  public static async createInstanceGivenBranch(
    repoId: { repo: string; owner: string },
    branch: string,
    client: ReturnType<typeof getOctokit>
  ) {
    const PRsInfo = await getBranchOpenPRs({ ...repoId, branch, client })

    if (PRsInfo.length === 0) {
      throw new Error(`No open PRs for '${branch}' branch`)
    }

    if (PRsInfo.length !== 1) {
      throw new Error(`More than one open PRs for '${branch}' branch`)
    }

    console.log(`${PRsInfo.length} PRs opened for branch '${branch}.'`)
    console.log(`Chose PR number ${PRsInfo[0].number}.`)
    return new PRHelper(repoId.owner, repoId.repo, PRsInfo[0].number, client)
  }

  constructor(
    private owner: string,
    private repo: string,
    private prNumber: number,
    private client: ReturnType<typeof getOctokit>
  ) {}

  private getIdObject() {
    return {
      owner: this.owner,
      repo: this.repo,
      issue_number: this.prNumber,
    }
  }

  public async addLabelToPR(label: string) {
    const { data } = await this.client.issues.addLabels({
      ...this.getIdObject(),
      labels: [label],
    })

    return data
  }

  public async removePRLabel(label: string) {
    const { data } = await this.client.issues.removeLabel({
      ...this.getIdObject(),
      name: label,
    })

    return data
  }

  public async listPRLabels() {
    const { data } = await this.client.issues.listLabelsOnIssue(this.getIdObject())
    return data
  }

  public hasPRLabel(labels: Array<{ name: string }>, label: string) {
    return labels.find((el: { name: string }) => el.name === label) != null
  }

  public async removeLabelIfExists(labels: Array<{ name: string }>, label: string) {
    if (this.hasPRLabel(labels, label)) {
      await this.removePRLabel(label)
    }
  }
}
