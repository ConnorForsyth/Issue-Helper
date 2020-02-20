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
    
    var params = context.issue({body: context.payload.issue.title})
    
    //First we need to get the payload, then take the title, compare it with generic errors
    //if no match, use stack exchange
    //need to find the most generic errors that are simple fixes - ranges from missing semi-colons to incomplete declarations such as var thisVar = and leaving it empty
    
    //hello.js: line 10, col 19, Unexpected early end of program.
    //potentially could have it look at the code as if it had access to it, could give read access - grab file name from error title and from there see what the offending line was
    
    //var test = context.payload.issue.title
    
    var newObject = JSON.parse(JSON.stringify(context.payload.issue.title));
    
    if(newObject.includes('Unexpected early end of program.'))
    {
      /*In here we need to write an explanation to what this error is and then paste said
        explanation as the new parameter for the comment
      */
      var testing = newObject
      var tellAnswer = testing.split(':')[1]
      tellAnswer = tellAnswer.split(',')[0]
      
      var potentialSolution = "If an unexpected early end of program has occured, it is very likely that you may have missed a semi-colon at the end of a variable. Please have another look at " + tellAnswer + " and see if you have missed a semi-colon."
      var newParams = context.issue({body: potentialSolution})
      return context.github.issues.createComment(newParams)
    }
    else
    {    
      // Post a comment on the issue
      return context.github.issues.createComment(params)
    }
    
  })
}
