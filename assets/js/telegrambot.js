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







function setApiToken(forced){
    if (typeof(Storage) !== "undefined") {
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
        // Code for localStorage/sessionStorage.
    } else {
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


function sendMessage(){
    var chatMessage = $("#textMessage").val();
    var chatId = $("#chatId").val();

    var HttpMessageSender = new XMLHttpRequest();
    HttpMessageSender.open("GET", "https://api.telegram.org/bot"+botToken+"/sendMessage?chat_id="+chatId+"&text="+encodeURI(chatMessage), true); // true for asynchronous 
    HttpMessageSender.onreadystatechange = function () {
        if(HttpMessageSender.readyState === XMLHttpRequest.DONE && HttpMessageSender.status === 200) {
            swal("Sweet!", "Message sent.", "success");
        }else if(HttpMessageSender.readyState === XMLHttpRequest.DONE && HttpMessageSender.status === 403) {
            swal("Damn!", "The user blocked the bot T.T", "warn");
        }else if (HttpMessageSender.readyState === XMLHttpRequest.DONE){
            swal("Damn!", "An error occourred.", "error");
        }
      };
    HttpMessageSender.send(null);
    HttpMessageSender.onreadystatechange
    
    //Clear Text area
    $("#textMessage").val("");
    localStorage.setItem("lastChatID", chatId);
}

function checkNewMessages(){
    var HttpMessageSender = new XMLHttpRequest();
    var updateURL = "https://api.telegram.org/bot"+botToken+"/getUpdates";
    HttpMessageSender.open("GET", updateURL, true); // true for asynchronous 
    HttpMessageSender.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var response = JSON.parse(this.responseText);
            NewResponseHandler(response);
        }else if (HttpMessageSender.readyState === XMLHttpRequest.DONE){
            console.error("Damn! An error occourred.");
        }
      };
    HttpMessageSender.send(null);
    HttpMessageSender.onreadystatechange
}

function NewResponseHandler(response){
    //$('#myTable tr:last').after("<tr><td>1</td><td>Column content</td><td>Column content</td><td>Column content</td><td>Column content</td></tr>");
        for(var i = 0; i < response.result.length; i++){
            if(response.result[i].update_id > lastUpdateId){
                
                var rowClass;
                if(response.result[i].edited_message == undefined){
                    if(response.result[i].message.chat.id<0){rowClass = "table-info";}else{rowClass = "table-success";} 
                //                                                  color                       update number                                                                        group/chat ID                                                                                      Person ID                                     Person Nickname                                       First name                                      Corpo messaggio
                    $('#chatHistory > tbody').prepend("<tr class=\"" + rowClass  +"\"><td>"+response.result[i].update_id+"</td><td><a href=\"#\" onclick=\"replyToId(event)\" value=\""+response.result[i].message.chat.id+"\">"+response.result[i].message.chat.id+"</a></td><td><a href=\"#\" onclick=\"#\" value=\""+response.result[i].message.from.id+"\" >@"+response.result[i].message.from.username+"</a></td><td>"+response.result[i].message.from.first_name+"</td><td>"+response.result[i].message.text+"</td></tr>");
                    if(!jlPage){
                        if($("#notificationCheckbox input").attr("checked") == "checked"){
                            var notification = new Notification('New mesage from '+response.result[i].message.from.username,{
                                body:response.result[i].message.text,
                                icon:'https://pbs.twimg.com/profile_images/519176711393406977/m6BFtJQW_400x400.png',
                                onshow: function(){setTimeout(notification.close, 1500);}
                            });
                        }
                }

                }else{
                    //Messaggio editato
                    $('#chatHistory > tbody').prepend("<tr class=\"table-warning\"><td>"+response.result[i].update_id+"</td><td><a href=\"#\" onclick=\"replyToId(event)\" value=\""+response.result[i].edited_message.chat.id+"\">"+response.result[i].edited_message.chat.id+"</a></td><td><a href=\"#\" onclick=\"#\" value=\""+response.result[i].edited_message.from.id+"\" >@"+response.result[i].edited_message.from.username+"</a></td><td>"+response.result[i].edited_message.from.first_name+"</td><td>"+response.result[i].edited_message.text+"</td></tr>");
                }
            }
        }
        
    lastUpdateId = response.result[response.result.length-1].update_id;
    jlPage = false;
}

/*
function clearRecentChats(event){
    event.preventDefault();
    $('#chatHistory > tbody >tr').remove();
}*/

$('#clearRecentChats').click(function(){
    $('#chatHistory > tbody').html(''); 
   });

function replyToId(event){
    $("#chatId").val(event.toElement.getAttribute("value"));
}



var botToken;
var lastUpdateId =11;//Update per get 
setApiToken();

//Check message interval
setInterval(checkNewMessages, 500);


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
$("#textMessage").keypress(function(event) {
    if( (event.keyCode == 10 || event.keyCode == 13) && event.ctrlKey) {
        sendMessage();
    }
});
