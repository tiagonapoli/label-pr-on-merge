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
      throw new Error('No commits found. Aborting...')
    }

    const mergeCommits = getMergeCommits(commits)
    if (mergeCommits.length === 0) {
      throw new Error('No merge commits found')
    }

    const [{ branch }] = mergeCommits
    const prHelper = await PRHelper.createInstanceGivenBranch(this.ctx.repo, branch, this.client)

    const labels = await prHelper.listPRLabels()
    const hasMergedLabel = prHelper.hasPRLabel(labels, this.actionConf.mergedLabelName)
    const hasStaleMergedLabel = prHelper.hasPRLabel(labels, this.actionConf.staleMergedLabelName)

    if (hasStaleMergedLabel) {
      await prHelper.removePRLabel(this.actionConf.staleMergedLabelName)
    }

    if (!hasMergedLabel) {
      await prHelper.addLabelToPR(this.actionConf.mergedLabelName)
    }
  }

  public async pushOnNonTargetBranch() {
    const branch = (this.ctx.payload.ref as string).replace('refs/head/', '')
    const prHelper = await PRHelper.createInstanceGivenBranch(this.ctx.repo, branch, this.client)
    const labels = await prHelper.listPRLabels()
    if (
      prHelper.hasPRLabel(labels, this.actionConf.mergedLabelName) &&
      !prHelper.hasPRLabel(labels, this.actionConf.staleMergedLabelName)
    ) {
      await prHelper.addLabelToPR(this.actionConf.staleMergedLabelName)
    }
  }
}
