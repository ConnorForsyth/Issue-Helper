module.exports = (app) => {
  // Your code here
  app.log('Yay! The app was loaded!')

  // example of probot responding 'Hello World' to a new issue being opened
  app.on('issues.opened', async context => {
    // `context` extracts information from the event, which can be passed to
    // GitHub API calls. This will return:
    //   {owner: 'yourname', repo: 'yourrepo', number: 123, body: 'Hello World!}
    //When referring to the event used context.payload
    app.log(context.payload.issue.title)
    
    const params = context.issue({body: context.payload.issue.title})
    
    //First we need to get the payload, then take the title, compare it with generic errors
    //if no match, use stack exchange
    //need to find the most generic errors that are simple fixes - ranges from missing semi-colons to incomplete declarations such as var thisVar = and leaving it empty
    
    
    
    
    
    // Post a comment on the issue
    return context.github.issues.createComment(params)
  })
}
