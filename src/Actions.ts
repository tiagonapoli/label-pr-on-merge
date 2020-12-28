import { getOctokit } from '@actions/github'
import { Context } from '@actions/github/lib/context'

import { PRHelper } from './PRHelper'
import { getMergeCommits } from './utils'

export interface ActionConfig {
  mergedLabelName: string
  staleMergedLabelName: string
  targetBranch: string
}

export class Actions {
  constructor(private ctx: Context, private client: ReturnType<typeof getOctokit>, private actionConf: ActionConfig) {}

  public async mergeInTargetBranch() {
    const { commits } = this.ctx.payload
    if (commits === null || commits.length === 0) {
      console.log('No commits found. Aborting...')
      return
    }

    const mergeCommits = getMergeCommits(commits)
    if (mergeCommits.length === 0) {
      console.log('No merge commits found. Aborting...')
      return
    }

    const [{ branch }] = mergeCommits

    console.log(`Merge from '${branch}' detected.`)
    const prHelper = await PRHelper.createInstanceGivenBranch(this.ctx.repo, branch, this.client)

    const labels = await prHelper.listPRLabels()
    console.log(`PR labels: ${labels.map((el) => el.name)}`)
    const hasMergedLabel = prHelper.hasPRLabel(labels, this.actionConf.mergedLabelName)
    const hasStaleMergedLabel = prHelper.hasPRLabel(labels, this.actionConf.staleMergedLabelName)

    if (hasStaleMergedLabel) {
      console.log(`Will remove '${this.actionConf.staleMergedLabelName}' label`)
      await prHelper.removePRLabel(this.actionConf.staleMergedLabelName)
    }

    if (!hasMergedLabel) {
      console.log(`Will add '${this.actionConf.mergedLabelName}' label`)
      await prHelper.addLabelToPR(this.actionConf.mergedLabelName)
    }
  }

  public async pushOnNonTargetBranch() {
    const branch = (this.ctx.payload.ref as string).replace('refs/head/', '')
    try {
      const prHelper = await PRHelper.createInstanceGivenBranch(this.ctx.repo, branch, this.client)
      const labels = await prHelper.listPRLabels()
      console.log(`PR labels: ${labels.map((el) => el.name)}`)

      if (
        prHelper.hasPRLabel(labels, this.actionConf.mergedLabelName) &&
        !prHelper.hasPRLabel(labels, this.actionConf.staleMergedLabelName)
      ) {
        console.log(`Will add '${this.actionConf.staleMergedLabelName}' label`)
        await prHelper.addLabelToPR(this.actionConf.staleMergedLabelName)
      }
    } catch (err) {
      if ((err.message as string).startsWith('No open PRs for')) {
        return
      }

      throw err
    }
  }
}
