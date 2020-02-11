/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  app.on('issues.opened', async context => {
    // `context` extracts information from the event, which can be passed to
    // GitHub API calls. This will return:
    //   { owner: 'yourname', repo: 'yourrepo', number: 123, body: 'Hello World !}
    const params = context.issue({ body: 'Hello World!' })

    // Post a comment on the issue
    return context.github.issues.createComment(params)
  })
}

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
