import * as core from '@actions/core'
import * as github from '@actions/github'
import { Context } from '@actions/github/lib/context'

import { ActionConfig, Actions } from './Actions'

async function run(ctx: Context, token: string, actionConf: ActionConfig) {
  const client = github.getOctokit(token)
  const actions = new Actions(ctx, client, actionConf)
  try {
    if (ctx.payload.ref === `refs/heads/${actionConf.targetBranch}`) {
      await actions.mergeInTargetBranch()
    } else {
      await actions.pushOnNonTargetBranch()
    }
  } catch (err) {
    core.setFailed(err.message)
  }
}

const ctx = github.context
const token = core.getInput('repo-token')
run(ctx, token, {
  targetBranch: core.getInput('target-branch'),
  mergedLabelName: core.getInput('merged-label-name'),
  staleMergedLabelName: core.getInput('stale-merged-label-name'),
})
