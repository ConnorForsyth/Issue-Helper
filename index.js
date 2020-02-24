
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
      //Note if this is the first time running you will need to install the relevant packages on the server
      //npm i ajv - requirement for stack exchange api
      //npm install stackexchange --save - node package that lets us make requests to the stack exchange api
      const stackexchange = require('stackexchange')
      const options = {version:2.2}
      
      var testContext = new stackexchange(options)
      
      //console.log(testContext)
      
      
      //Now all we need to do now is simply paste their error message as a title
      var filter = {
        pagesize:1,
        title: issueTitleObject,
        order:'asc'
      }
      
      //Need to filter our search specifically to stack overflow which is the site that answers programming questions
      filter.site = 'stackoverflow'      
      
      testContext.search.advanced(filter, function(err,results){
        if(err) throw err
        
        //Lets have a look at what stackexchange returned
        console.log(results.items)
        
        function isEmptyObject(obj) {
          return !Object.keys(obj).length;
        }
        
        if(isEmptyObject(results.items))
        {
          var changeResponse = "We have been unsuccessful in finding a solution to the issue, you are facing. We have notified [INSERT NAME HERE] and help should arrive shortly"    
          var newParams = context.issue({body: changeResponse})
          return context.github.issues.createComment(newParams)
        }
        
        else
        {
          //Successful in retrieving an answer from stackoverflow - now need to compare questions - one with most points is used  
        }
        
        
      })

    }
    
  })
}
