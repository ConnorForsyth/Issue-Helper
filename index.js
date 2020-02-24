
module.exports = (app) => {
  // Your code here
  
  app.log('Yay! The app was loaded!')

  // example of probot responding 'Hello World' to a new issue being opened
  app.on('issues.opened', async context => {
    
    // `context` extracts information from the event, which can be passed to
    // GitHub API calls. This will return:
    //   {owner: 'yourname', repo: 'yourrepo', number: 123, body: 'Hello World!}
    //When referring to the event used context.payload
    app.log(context.payload.issue.title);
    
    var params = context.issue({body: context.payload.issue.title})
    
    //First we need to get the payload, then take the title, compare it with generic errors
    //if no match, use stack exchange
    //need to find the most generic errors that are simple fixes - ranges from missing semi-colons to incomplete declarations such as var thisVar = and leaving it empty
    
    //hello.js: line 10, col 19, Unexpected early end of program.
    //potentially could have it look at the code as if it had access to it, could give read access - grab file name from error title and from there see what the offending line was
    
    //var test = context.payload.issue.title
    
    //Parse the returned Github response to string - in this instance we only want the issue title
    var issueTitleObject = JSON.parse(JSON.stringify(context.payload.issue.title))
    
    if(issueTitleObject.includes('Unexpected early end of program.'))
    {
      /*In here we need to write an explanation to what this error is and then paste said
        explanation as the new parameter for the comment
      */
      var testing = issueTitleObject
      var getErrorLine = testing.split(':')[1]
      getErrorLine = getErrorLine.split(',')[0]
      
      var potentialSolution = "If an unexpected early end of program has occured, it is very likely that you may have started creating a new variable and have forgotten to assign it a value. Please have another look at " + getErrorLine + " and see if you have missed a semi-colon."
      var newParams = context.issue({body: potentialSolution})
      return context.github.issues.createComment(newParams)
    }
    else
    {    
      // Post a comment on the issue
      //Now we want to connect to stack exchange api and pass the parameters
      const stackexchange = require('stackexchange')
      const options = {version:2.2}
      
      var testContext = new stackexchange(options)
      
      var filter = {
        pagesize:2,
        tagged:'node.js',
        order:'asc'
      }
      
      filter.site = 'stackoverflow'
      testContext.questions.questions(filter, function(err, results){
        if(err)throw err
        
        console.log(results.items)
        console.log(results.has_more)
      })
      
     
      return context.github.issues.createComment(params)
    }
    
  })
}
