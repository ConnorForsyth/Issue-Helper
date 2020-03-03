
module.exports = (app) => {
 
  
  app.log('Yay! The app was loaded!')

  // example of probot responding 'Hello World' to a new issue being opened
  app.on('issues.opened', async context => {
    
     var acceptedAnswerId
    // `context` extracts information from the event, which can be passed to
    // GitHub API calls. This will return:
    //   {owner: 'yourname', repo: 'yourrepo', number: 123, body: 'Hello World!}
    //When referring to the event used context.payload
    var organisationOwnerId = context.payload.repository.owner.id;
    var organisationOwner = context.payload.repository.owner.login;
    var params = context.issue({body: context.payload.issue.title})
    
    //First we need to get the payload, then take the title, compare it with generic errors
    //if no match, use stack exchange
    //need to find the most generic errors that are simple fixes - ranges from missing semi-colons to incomplete declarations such as var thisVar = and leaving it empty
    
    //hello.js: line 10, col 19, Unexpected early end of program.
    //potentially could have it look at the code as if it had access to it, could give read access - grab file name from error title and from there see what the offending line was
    
      
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
      //When seriously testing please use var issueTitleObject
      
      /* Problem with the filtering in that it will be very likely that returned results could be duplicate questions
         and if it is a duplicate question it is likely there is no relevant answer to the posted question  
      */ 
      
      
      //undefined in Javascript?
      
      var filter = {
        pagesize: '20',
        title: 'zzzzzzzzzzzzzzzzzzzQQQQQQQQQQQQAAAAA',
        accepted: 'True',
        sort:'relevance',
        order:'asc'
      }
      
      
      
      //Need to filter our search specifically to stack overflow which is the site that answers programming questions
      filter.site = 'stackoverflow'      
      
      testContext.search.advanced(filter, function(err,results){
        if(err) throw err
        
        //Lets have a look at what stackexchange returned
        //console.log(results.items)
        
        function isEmptyObject(obj) {
          return !Object.keys(obj).length;
        }
        
        if(isEmptyObject(results.items))
        {
          /* In the original post we should be able to retrieve the owner and the poster users, if they aren't the same we can tag the owner
             who in this case will be the lecturer 
          */
          //As the creator won't be the same as the owner i.e. the lecturer
          var changeResponse = "We have been unsuccessful in finding a solution to the issue, you are facing. We have notified " + organisationOwner + " and help should arrive shortly"    
          var newParams = context.issue({body: changeResponse})
          //Need to get the assignees - maybe not necessarily the owner
          //return context.github.issues.assignee(organisationOwnerId)
          app.log(context.payload)
          return context.github.issues.createComment(newParams)
          
        }
        
        else
        {
          //Successful in retrieving an answer from stackoverflow - now need to compare questions - one with most points is used  
          var count = Object.keys(results.items).length
          //console.log(results.items)
          
          for(var i=0; i<count; i++)
          {
            
            var topAnswers = []
            var currentAnswerScore
            var topScore            
            var topAnswerId
            
            if(results.items[i].is_answered == true)
            {                     
                if(i == 0)
                {
                  topAnswerId = i 
                  topScore = results.items[i].score
                  console.log("Current highest score is: " + topScore + " at position: " + topAnswerId)
                }
                else
                {
                  //Compare answer scores and determine which is higher - previous or current
                  currentAnswerScore = results.items[i].score
                  //console.log("i equals: " + i)
                  if(currentAnswerScore > topScore)
                  {
                    topAnswerId = i;
                    topScore = currentAnswerScore;
                    console.log("Current highest score is: " + topScore + " at position: " + topAnswerId)
                  }
                  //return context.github.issues.createComment(params)  
                }
                
              
            
            }            
            
          }
          //console.log(results.items[topAnswerId])
          //Now we have the highest scoring answer which we will now retrieve
          acceptedAnswerId = results.items[topAnswerId].accepted_answer_id
          console.log(acceptedAnswerId)
          
        }
        
        
      })//End of stack overflow advanced search
      
      console.log("The accepted answer id is currently: " + acceptedAnswerId)
    }
    
  })
}
