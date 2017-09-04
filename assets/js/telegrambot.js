//Save last chat ID
if (typeof(Storage) !== "undefined") {
    if(localStorage.getItem("lastChatID") != null ){
        $("#chatId").val(localStorage.getItem("lastChatID"));
    }
}

//just loaded page var
var jlPage = true;

//Notification permission var
var isNotificationsAllowed = false;

//Ask notification permission
Notification.requestPermission(function(p){
    if (p == 'denied') {
        isNotificationsAllowed = false;
        $("#notificationCheckbox input").attr("checked","false");
    } else if(p == 'garanted'){
        isNotificationsAllowed = true;
        $("#notificationCheckbox input").attr("checked","true");
    }
});

//Set the Telegram bot API token
function setApiToken(forced){
    if (typeof(Storage) !== "undefined") {
        //Save token in local storage
        if(localStorage.getItem("botToken") == null || forced ){
            swal({
                title: "Gimme the token!",
                text: "Write me the token pliz:",
                type: "input",
                showCancelButton: false,
                closeOnConfirm: true,
                animation: "slide-from-top",
                inputPlaceholder: "Token goes here"
              },
              function(inputText){
                //if (inputText === false) return false;
                
                if (inputText == "") {
                  swal.showInputError("You need to write something!");
                  return false
                }else{
                    localStorage.setItem("botToken", inputText);
                    botToken = inputText;
                    return true;
                }
            });
        }else{
            botToken=localStorage.getItem("botToken");
        }
        
    } else {
        //LocalStorage not abailable
        swal({
            title: "Gimme the token!",
            text: "Write me the token pliz:",
            type: "input",
            showCancelButton: false,
            closeOnConfirm: true,
            animation: "slide-from-top",
            inputPlaceholder: "Token goes here"
          },
          function(inputText){
            //if (inputText === false) return false;
            if (inputText == "") {
              swal.showInputError("You need to write something!");
              return false
            }else{
                botToken=inputText;
                return true;
            }
        });
    }
}

//Function invoked to send a message...
//Should be improved passing the text to be sent as a parameter
function sendMessage(){
    var chatMessage = $("#textMessage").val();
    var chatId = $("#chatId").val();
    //Check if message is empty
    if(chatMessage==""){
        swal("Attention please :3!", "You could have forgot to enter the message :3", "info");
        return;
    }
    //Sending
    var HttpMessageSender = new XMLHttpRequest();
    HttpMessageSender.open("GET", "https://api.telegram.org/bot"+botToken+"/sendMessage?chat_id="+chatId+"&text="+encodeURI(chatMessage), true); // true for asynchronous 
    HttpMessageSender.onreadystatechange = function () {
        if(HttpMessageSender.readyState === XMLHttpRequest.DONE && HttpMessageSender.status === 200) {
            swal("Sweet!", "Message sent.", "success");
            //Clear Text area
            $("#textMessage").val("");
        }else if(HttpMessageSender.readyState === XMLHttpRequest.DONE && HttpMessageSender.status === 403) {
            swal("Damn!", "The user blocked the bot T.T", "warning");
            return;
        }else if (HttpMessageSender.readyState === XMLHttpRequest.DONE){
            swal("Damn!", "An error occourred.", "error");
            return;
        }
      };
    HttpMessageSender.send(null);
    HttpMessageSender.onreadystatechange
    
    //Save last chat ID
    localStorage.setItem("lastChatID", chatId);
}

//Function used to check and write down incoming messages
function checkNewMessages(){
    var HttpMessageSender = new XMLHttpRequest();
    var updateURL = "https://api.telegram.org/bot"+botToken+"/getUpdates";
    HttpMessageSender.open("GET", updateURL, true); // true for asynchronous 
    HttpMessageSender.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var response = JSON.parse(this.responseText);
            //Call to a function that handles and write down in the page new messages
            NewResponseHandler(response);
        }
      };
    HttpMessageSender.send(null);
    HttpMessageSender.onreadystatechange
}

function NewResponseHandler(response){
    for(var i = 0; i < response.result.length; i++){
        if(response.result[i].update_id > lastUpdateId){
            var rowClass;
            //Check if the message is edited or not
            if(response.result[i].edited_message == undefined){
                //Check if the message comes from a group chat
                //Need to be improved by checking tif the message is private or not
                //Assign a blue background if the message is from a group, a geen one if it's from a user via direct chat
                if(response.result[i].message.chat.id<0){rowClass = "table-info";}else{rowClass = "table-success";} 
                    $('#chatHistory > tbody').prepend("<tr class=\"" + rowClass  +"\"><td>"+response.result[i].update_id+"</td><td><a href=\"#\" onclick=\"replyToId(event)\" value=\""+response.result[i].message.chat.id+"\">"+response.result[i].message.chat.id+"</a></td><td><a href=\"#\" onclick=\"replyToId(event)\" value=\""+response.result[i].message.from.id+"\" >@"+response.result[i].message.from.username+"</a></td><td>"+response.result[i].message.from.first_name+"</td><td>"+response.result[i].message.text+"</td></tr>");
                    if(!jlPage){
                    if($("#notificationCheckbox input").attr("checked") == "checked"){
                        //Desktop notification
                        var notification = new Notification('New mesage from '+response.result[i].message.from.username,{
                            //NOtification settings
                            body:response.result[i].message.text,
                            tag:  "push-notification-tag",
                            icon:'https://pbs.twimg.com/profile_images/519176711393406977/m6BFtJQW_400x400.png',
                            onshow: function(){setTimeout(notification.close, 1500);}
                        });
                        //Pew sound on notification
                        //Thanks to malware tech :3
                        new Audio('https://intel.malwaretech.com/sounds/pew.mp3').play();
                    }
                }
            }else{
                //Edited message
                $('#chatHistory > tbody').prepend("<tr class=\"table-warning\"><td>"+response.result[i].update_id+"</td><td><a href=\"#\" onclick=\"replyToId(event)\" value=\""+response.result[i].edited_message.chat.id+"\">"+response.result[i].edited_message.chat.id+"</a></td><td><a href=\"#\" onclick=\"replyToId(event)\" value=\""+response.result[i].edited_message.from.id+"\" >@"+response.result[i].edited_message.from.username+"</a></td><td>"+response.result[i].edited_message.from.first_name+"</td><td>"+response.result[i].edited_message.text+"</td></tr>");
            }
        }
    }
    lastUpdateId = response.result[response.result.length-1].update_id;
    jlPage = false;
}

//Clear the message hostory
//Needs to be fixed
$('#clearRecentChats').click(function(){
    $('#chatHistory > tbody').html(''); 
   });

//Function used to replying to a user clicking on its username or ID
function replyToId(event){
    $("#chatId").val(event.toElement.getAttribute("value"));
}


var botToken;//var containing the bot token
var lastUpdateId =11;//Last update id received
setApiToken();//Try to set the token if not setted (it's not forced)

//Check message interval
setInterval(checkNewMessages, 500);

//Handles notification 
$('#notificationCheckbox input').change(function() {
    if(!isNotificationsAllowed){
        Notification.requestPermission(function(p){
            if (p == 'denied') {
                isNotificationsAllowed = false;
                $("#notificationCheckbox input").attr("checked","false");
            } else if(p == 'garanted'){
                isNotificationsAllowed = true;
                $("#notificationCheckbox input").attr("checked","true");
            }
        });
    }
});
    

//On enter send message
$(document).keypress(function(event) {
    if( (event.keyCode == 10 || event.keyCode == 13) && event.ctrlKey) {
        sendMessage();
    }
});
