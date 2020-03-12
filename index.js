
module.exports = (app) => {
 
  //The depreciation octokit error message is an issue with the probot library that will be fixed in v10 
  
  //app.log('Yay! The app was loaded!')

  //Need to update this check with a flag - i.e. issues opened with certain tag
  app.on('issues.opened', async context => {
     
    
    var acceptedAnswerId
    var questionId
    var answerResponse
    var questionResponse
    // `context` extracts information from the event, which can be passed to
    //When referring to the event used context.payload
    //var organisationOwnerId = context.payload.repository.owner.id
    //var organisationOwner = context.payload.repository.owner.login
    var params = context.issue({body: context.payload.issue.title})
 
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
      
      //console.log(testContext)
      
      
      //Now all we need to do now is simply paste their error message as a title
      //When seriously testing please use var issueTitleObject
      
      /* Problem with the filtering in that it will be very likely that returned results could be duplicate questions
         and if it is a duplicate question it is likely there is no relevant answer to the posted question  
      */      
      
      var filter = {
        pagesize: '10',
        title: issueTitleObject,
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
          // Old response - var changeResponse = "We have been unsuccessful in finding a solution to the issue, you are facing. We have notified " + organisationOwner + " and help should arrive shortly"    
          var changeResponse = "We have been unsuccessful in finding a solution to the issue, you are facing. Your lecturer has been made aware and help should arrive shortly" 
          var newParams = context.issue({body: changeResponse})
          var githubObject = context
          //Call function that will notify user that an answer could not be found and a member of staff will help
          notifyStaff(githubObject, newParams)
          
        }
        
        else
        {
          //Successful in retrieving an answer from stackoverflow - now need to compare questions - one with most points is used  
          var count = Object.keys(results.items).length
          
          for(var i=0; i<count; i++)
          {
            
            var topAnswers = []
            var currentAnswerScore
            var topScore            
            var topAnswerId
            
            if(results.items[i].is_answered == true)
            {                     
                if(i === 0)
                {
                  topAnswerId = i 
                  topScore = results.items[i].score
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
                  }                  
                }
            }         
          }          
          //Now we have the highest scoring answer we will keep a record of the answer id along with the question id
          acceptedAnswerId = results.items[topAnswerId].accepted_answer_id     
          questionId = results.items[topAnswerId].question_id      
          
          /* Calls function that will build a response to the users issue 
             by retrieving the questions body for context and the answer to provide 
             insight into a potential solution
          */
          getStackOverflowAnswer(questionId, acceptedAnswerId)
        }
        
        
      })//End of stack overflow advanced search
      
      
    
      function getStackOverflowAnswer(theQuestionId, theAnswerId)
      {
        /* Now that we've successfully received the accepted answer id we can retrieve the answer
           and then parse the body of the answer into a comment for the user to see
        */
        
        /*For some unknown reason the answers method was not working with the stackexchange module
          so have opted to use the fetch module to retrieve the answer from stackexchange instead.
          The module hasn't been updated in over a year and it is likely that the stackexchange api
          may have changed resulting in the issues I am having with the questions and answers functions
        */
        
        //Seemingly there is an issue with the stackexchange package so will instead use a generic http request
        const fetch = require('node-fetch')
        
        //First we need to setup the url to retrieve the answer from stackexchange
        
        /*These urls were retrieved from the stackexchange api documentation for more information: https://api.stackexchange.com/docs
        */
        
        //To retrieve the body of the question and the accepted answer a special filter was required 
        let questionUrl = "https://api.stackexchange.com/2.2/questions/" + theQuestionId + "?order=desc&sort=activity&site=stackoverflow&filter=!-MOiNm40DvABDyvq_C5CM_yZvkjotiuv5"
        let answerUrl = "https://api.stackexchange.com/2.2/answers/"+ theAnswerId + "?order=desc&sort=activity&site=stackoverflow&filter=!9Z(-wzu0T"
        
        //HTTP GET method used as we only want to retrieve information from stackexchange
        let settings = {method: "Get"}        
        
        /*Get the JSON data from stackexchange api
          Currently the bot uses the free licence which allows for 300 calls to the api per day which is more than enough for prototyping 
        */
        fetch(questionUrl, settings)
          .then(res => res.json())
          .then((json)=>{
            /* Now that we have received a response from stackexchange and received the json data we can parse 
               the body of the question retrieved (gives us context to the answer) and store it into the global variable questionResponse
            */
            questionResponse = JSON.parse(JSON.stringify(json.items[0].body))           
            getAnswerAndSendSolution(questionResponse)
        })
        
        
        //Both requests were being done simulatenously before so calling this function after
        //the question body has been retrieved ensures the posted comment will contain both the context and solution
        function getAnswerAndSendSolution(retrievedQuestionResponse){
          //Get the JSON data from stackexchange api        
          fetch(answerUrl, settings)
            .then(res => res.json())
            .then((json)=>{            
              //Now that we have the json we can create the message body     
              answerResponse = JSON.parse(JSON.stringify(json.items[0].body))
      
              //Starting message to give user context of what they will see on their issue
              var beginResponse = "<strong><p>Based on your issue we have found the following answer.</p></strong><strong><h2>Context</h2></strong>"
              //Combine the starting message along with the question body and the answer body
              var combinedResponses = beginResponse + retrievedQuestionResponse + "<br/> <strong><h2>Proposed Solution</h2></strong>"  + answerResponse + "<br/> <strong><p>If you require further help, please respond by commenting Yes.</p></strong>"

              //Setup response
              var solutionBody = context.issue({body: combinedResponses})
              //Create a new comment on the users issue with a proposed solution
              return context.github.issues.createComment(solutionBody)
          })          
        }
      }
    } 
  })//End of issues opened
  
  //Here we can check whether the user still requires help
  app.on('issue_comment.created', async context => {
    
    var checkReturnedMessage = JSON.parse(JSON.stringify(context.payload.comment.body).toLowerCase());
  
    if(checkReturnedMessage === "yes")
    {      
      //Literally just add the user here - think I might make the response a function for reusability
      var notifiedMessage = "Your lecturer has been made aware and help should arrive shortly"    
      app.log(notifiedMessage)
      var wrapNotification = context.issue({body: notifiedMessage})
      
      var githubObject = context
      
      //Notify the staff that the user still requires help
      notifyStaff(githubObject, wrapNotification)
    }
  
  
  })
  
  function notifyStaff(theContext, theMessageToUser){
    /*As there is more than one way in which staff can be notified by the app - reusable code is better
    As the function sits outside the context - function will not know what we are wanting to do 
    so we have to pass in the context as a parameter
    */
    
    
    
    //Need to get the assignees - maybe not necessarily the owner   
          
    //You can add more assignees by separating into a list
    const addAssigneeParams = theContext.issue({assignees: ["ConnorForsyth"]})      
    //return context.github.issues.addAssignees(addAssigneeParams)
    //Since this is a classroom - the lecturer should be able to get their github account id, along with any 
    return theContext.github.issues.createComment(theMessageToUser) + theContext.github.issues.addAssignees(addAssigneeParams)  
    
  }
  
  
}
