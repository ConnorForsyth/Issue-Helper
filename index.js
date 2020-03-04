
module.exports = (app) => {
 
  //The depreciation octokit error message is an issue with the probot library that will be fixed in v10 
  
  app.log('Yay! The app was loaded!')

  // example of probot responding 'Hello World' to a new issue being opened
  app.on('issues.opened', async context => {
     
    let acceptedAnswerId
    let questionId
    let answerResponse
    let questionResponse
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
      //Need to add in the title as the question here to get a success
      var filter = {
        pagesize: '1',
        title: issueTitleObject,
        accepted: 'True',
        sort:'relevance',
        order:'asc',
        withbody: 'true'
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
          const tempParamB = context.issue()
          
          //You can add more assignees by separating into a list
          //const addAssigneeParams = context.issue({assignees: [tempParamB.owner]}) 
          //Testing to see if you can add any random users
          const addAssigneeParams = context.issue({assignees: ["ConnorForsyth"]})      
          //return context.github.issues.addAssignees(addAssigneeParams)
          //Since this is a classroom - the lecturer should be able to get their github account id, along with any 
          return context.github.issues.createComment(newParams) + context.github.issues.addAssignees(addAssigneeParams)
          
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
          //console.log(acceptedAnswerId)
          
          app.log(results.items[topAnswerId].question_id)
          questionId = results.items[topAnswerId].question_id      
         
          getStackOverflowAnswer(questionId, acceptedAnswerId)
        }
        
        
      })//End of stack overflow advanced search
      
      
    
      function getStackOverflowAnswer(theQuestionId, theAnswerId)
      {
        /* Now that we've successfully received the accepted answer id we can retrieve the answer
           and then parse the body of the answer into a comment for the user to see
        */
        
        /*For some unknown reason the answers method was not working with the stackexchange module
          so have opted to use the fetch module to retrieve the answer from stackexchange instead
        */
        
        //Seemingly there is an issue with the stackexchange package so will instead use a generic http request
        const fetch = require('node-fetch')
        
        //First we need to setup the url to retrieve the answer from stackexchange
        let questionUrl = "https://api.stackexchange.com/2.2/questions/" + theQuestionId + "?order=desc&sort=activity&site=stackoverflow&filter=!-MOiNm40DvABDyvq_C5CM_yZvkjotiuv5"
        let answerUrl = "https://api.stackexchange.com/2.2/answers/"+ theAnswerId + "?order=desc&sort=activity&site=stackoverflow&filter=!9Z(-wzu0T"
        //HTTP method being used
        let settings = {method: "Get"}
        
        
        
        //Get the JSON data from stackexchange api -- atm the free licence allows for 300 calls to the api which is more than enough for prototyping        
        fetch(questionUrl, settings)
          .then(res => res.json())
          .then((json)=>{
           
            //Now that we have the json we can create the message body
            //app.log(json.items[0].body)
            questionResponse = JSON.parse(JSON.stringify(json.items[0].body))
            //app.log(questionResponse)
            //var answerParams = context.issue({body: answerResponse})
            //app.log(answerParams)
            //return context.github.issues.createComment(answerParams)
        })
        
        
        //Get the JSON data from stackexchange api -- atm the free licence allows for 300 calls to the api which is more than enough for prototyping        
        fetch(answerUrl, settings)
          .then(res => res.json())
          .then((json)=>{
            //app.log(json)
            //Now that we have the json we can create the message body
            //app.log(json.items[0].body)
            app.log(questionResponse)
            answerResponse = JSON.parse(JSON.stringify(json.items[0].body))
            
            var beginResponse = "Based on your issue we have found the following answer." + "\n" + "**Context**"
            var combinedResponses = beginResponse + questionResponse + "\n"  + answerResponse
          
            //app.log(answerResponse)
            var answerParams = context.issue({body: combinedResponses})
            //app.log(answerParams)
            return context.github.issues.createComment(answerParams)
        })
        
        
        
        
      }
    
    } 
  })
}
