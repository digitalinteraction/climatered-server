const core = require('@actions/core')
const github = require('@actions/github')

async function main() {
  const message = core.getInput('message')

  const pr = github.context.pr

  if (!pr) {
    core.setFailed('PR not found')
    return
  }

  const client = github.getOctokit(core.getInput('token'))
  core.debug(`message: ${message}`)

  const result = await client.rest.issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: pr.number,
    body: message,
  })

  core.debug(`Comment URL: ${result.data.html_url}`)
}

main().catch((error) => {
  core.setFailed(error.message)
})
