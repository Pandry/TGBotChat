//Set the Telegram bot API token
function setApiToken(forced) {
    if (typeof (Storage) !== "undefined") {
        //Save token in local storage
        if (localStorage.getItem("botToken") == null || forced) {
            swal({
                title: "Gimme the token!",
                text: "Write me the token pliz:",
                type: "input",
                showCancelButton: false,
                closeOnConfirm: true,
                animation: "slide-from-top",
                inputPlaceholder: "Token goes here"
            },
                function (inputText) {
                    //if (inputText === false) return false;

                    if (inputText == "") {
                        swal.showInputError("You need to write something!");
                        return false
                    } else {
                        localStorage.setItem("botToken", inputText);
                        botToken = inputText;
                        return true;
                    }
                });
        } else {
            botToken = localStorage.getItem("botToken");
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
            function (inputText) {
                //if (inputText === false) return false;
                if (inputText == "") {
                    swal.showInputError("You need to write something!");
                    return false
                } else {
                    botToken = inputText;
                    return true;
                }
            });
    }
}

//Function invoked to send a message...
//Should be improved passing the text to be sent as a parameter
function sendMessage() {
    //var chatMessage = $("body > div.container > div > div.emojionearea.form-control.centered > div.emojionearea-editor").val();
    var chatMessage = emojione.data("emojioneArea").getText();
    var chatId = $("#chatId").val().split(':')[0];
    var replyMessageId = $("#chatId").val().split(':')[1];


    //Check if message is empty
    if (chatMessage == "") {
        swal("Attention please :3!", "You could have forgot to enter the message :3", "info");
        return;
    }
    //Sending
    var sendRequest = "https://api.telegram.org/bot" + botToken + "/sendMessage?chat_id=" + chatId + "&text=" + encodeURI(chatMessage);
    if (replyMessageId != undefined) {
        sendRequest += "&reply_to_message_id=" + replyMessageId;
    }


    var HttpMessageSender = new XMLHttpRequest();
    HttpMessageSender.open("GET", sendRequest, true); // true for asynchronous 
    HttpMessageSender.onreadystatechange = function () {
        if (HttpMessageSender.readyState === XMLHttpRequest.DONE && HttpMessageSender.status === 200) {
            swal("Sweet!", "Message sent.", "success");
            //Clear Text area
            $("#textMessage").val("");
            //Save ID
            addChatNumber(chatId, findNickById(chatId));
        } else if (HttpMessageSender.readyState === XMLHttpRequest.DONE && HttpMessageSender.status === 403) {
            swal("Damn!", "The user blocked the bot T.T <br/>(or he never started it)", "warning");
            return;
        } else if (HttpMessageSender.readyState === XMLHttpRequest.DONE) {
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
function checkNewMessages() {
    if(botToken==undefined){
        return;}
    var HttpMessageSender = new XMLHttpRequest();
    if (thisBot == null) {
        HttpMessageSender.open("GET", "https://api.telegram.org/bot" + botToken + "/getMe", true); // true for asynchronous 
        HttpMessageSender.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var response = JSON.parse(this.responseText);
                if (response.ok == true) {
                    thisBot = response.result;
                    $("#sendingAs").html("(Sending messages as <a href=\"https://t.me/" + thisBot.username + "\" target=\"_blank\">@" + thisBot.username + "</a>)");
                }
            }
        };
        HttpMessageSender.send(null);
        HttpMessageSender.onreadystatechange;
    } else {
        var updateURL = "https://api.telegram.org/bot" + botToken + "/getUpdates?offset=" + (parseInt(lastUpdateId) + 1)
        HttpMessageSender.open("GET", updateURL, true); // true for asynchronous 
        HttpMessageSender.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var response = JSON.parse(this.responseText);
                //Call to a function that handles and write down in the page new messages
                NewResponseHandler(response);
            }
        };
        HttpMessageSender.send(null);
        HttpMessageSender.onreadystatechange;
    }

}

function NewResponseHandler(response) {
    if (response.ok == true && JSON.stringify(response.result) != JSON.stringify([])) {
        for (var i = 0; i < response.result.length; i++) {
            if (response.result[i].update_id > lastUpdateId) {
                var rowClass;
                //Check if the message is edited or not
                if (response.result[i].edited_message == undefined) {
                    //Check if the message comes from a group chat
                    //Need to be improved by checking tif the message is private or not
                    //Assign a blue background if the message is from a group, a geen one if it's from a user via direct chat
                    var recDate = new Date(response.result[i].message.date * 1000);
                    var messageBody = "";
                    var messageClass;
                    if (response.result[i].message.chat.id < 0) { rowClass = "table-info"; } else { rowClass = "table-success"; }
                    if (response.result[i].message.new_chat_participant != undefined) {
                        //New user to the group"
                        messageBody = "New user";
                        messageClass = "table-success";
                    } else if (response.result[i].message.sticker != undefined) {
                        //Sticker
                        messageBody = "Sticker [" + response.result[i].message.sticker.emoji + "]";
                    } else if (response.result[i].message.left_chat_member != undefined) {
                        messageBody = "User left [@" + response.result[i].message.left_chat_member.username + "]";
                    } else {
                        try{
                        messageBody = response.result[i].message.text.replace(/\n/g,"<br/>");
                        }catch(Exception){}
                        if (messageBody == undefined) {
                            console.log("Undefined message...", response.result[i]);
                        }
                        logNewMessage(response.result[i]);
                        $('#chatHistory > tbody').prepend("<tr class=\"" + rowClass + "\"><td><a href=\"#\" onclick=\"replyToId(event)\" value=\"" + response.result[i].message.chat.id + ":" + response.result[i].message.message_id + "\">" + response.result[i].message.message_id + "</a></td><td>" + recDate.toLocaleString() + "</td><td><a href=\"#\" onclick=\"replyToId(event)\" value=\"" + response.result[i].message.chat.id + "\">" + response.result[i].message.chat.id + "</a></td><td><a href=\"#\" onclick=\"replyToId(event)\" value=\"" + response.result[i].message.from.id + "\" >@" + response.result[i].message.from.username + "</a></td><td>" + response.result[i].message.from.first_name + "</td><td class=\"" + messageClass + "\">" + messageBody + "</td></tr>");

                        addChatNumber(response.result[i].message.chat.id, findNickById(response.result[i].message.chat.id));
                    }
                    if (!jlPage) {
                        if ($("#notificationCheckbox input").prop("checked")) {
                            //Desktop notification
                            var notification = new Notification('New mesage from ' + response.result[i].message.from.username, {
                                //NOtification settings
                                body: response.result[i].message.text,
                                tag: "push-notification-tag",
                                icon: 'https://pbs.twimg.com/profile_images/519176711393406977/m6BFtJQW_400x400.png',
                                onshow: function () { setTimeout(notification.close, 1500); }
                            });
                            //Pew sound on notification
                            //Thanks to malware tech :3
                            var audioNot = new Audio('https://intel.malwaretech.com/sounds/pew.mp3');
                            audioNot.volume = 0.2;
                            audioNot.play()
                        }
                    }
                } else {
                    var recDate = new Date(response.result[i].edited_message.date * 1000);
                    //Edited message
                    try{
                    response.result[i].edited_message.text = response.result[i].edited_message.text.replace(/\n/g,"<br/>");
                    }catch(Exception){}
                    $('#chatHistory > tbody').prepend("<tr class=\"table-warning\"><td><a href=\"#\" onclick=\"replyToId(event)\" value=\"" + response.result[i].edited_message.chat.id + ":" + response.result[i].edited_message.message_id + "\">" + response.result[i].edited_message.message_id + "</a></td><td>" + recDate.toLocaleString() + "</td><td><a href=\"#\" onclick=\"replyToId(event)\" value=\"" + response.result[i].edited_message.chat.id + "\">" + response.result[i].edited_message.chat.id + "</a></td><td><a href=\"#\" onclick=\"replyToId(event)\" value=\"" + response.result[i].edited_message.from.id + "\" >@" + response.result[i].edited_message.from.username + "</a></td><td>" + response.result[i].edited_message.from.first_name + "</td><td>" + response.result[i].edited_message.text + "</td></tr>");
                }
            }
        }
        lastUpdateId = response.result[response.result.length - 1].update_id;
        jlPage = false;
    }
}

//Function used to replying to a user clicking on its username or ID
function replyToId(event) {
    $("#chatId").val(event.toElement.getAttribute("value"));
}



function NotificationsPermisionChecker() {
    if (!isNotificationsAllowed) {
        Notification.requestPermission().then(function (p) {
            if (p != 'granted') {
                isNotificationsAllowed = false;
                $("#notificationCheckbox input").prop("checked", false);
                if (p == 'denied') {
                    swal("Oh no!", "You blocked the notifications for this site, you need to unblock them if you want to receive notifications!", "error");
                }
            } else if (p == 'granted') {
                localStorage.setItem("AllowNotifications", $("#notificationCheckbox input").prop("checked"));
            }
        });
    }
}


function logNewMessage(response) {
    messagesLog.unshift({ id: response.message.chat.id, nick: response.message.chat.title == null ? response.message.from.username : response.message.chat.title, message: response.message.text });
}


function findNickById(chatId) {
    for (var i = 0; i < messagesLog.length; i++) {
        if (chatId == messagesLog[i].id) {
            return messagesLog[i].nick;
        }
    }
    return "Unnamed";
}




function addChatNumber(chatId, nickname) {
    var recentChats = localStorage.getItem("recentChats");
    if (recentChats != null) {
        recentChats = JSON.parse(recentChats);
        for (var i = 0; i < recentChats.length; i++) {
            if (chatId == recentChats[i].id) {
                recentChats.splice(":", 1);
            }
        }
    } else {
        recentChats = [];
    }
    recentChats.unshift({ "id": chatId, "nick": nickname });
    localStorage.setItem("recentChats", JSON.stringify(recentChats));
    populateHistory();
}

function populateHistory(moreRes) {
    var recentChats = JSON.parse(localStorage.getItem("recentChats"));
    if (recentChats.length > 0) {
        if (recentChats != null) {
            var maxRes = 5;
            if (moreRes) {
                maxRes = $("#recentChatsDropdownDiv").get(0).childElementCount + 5;
            }
            $("#recentChatsDropdownDiv a").remove();
            for (var i =0; i < recentChats.length && i < maxRes; i++) {
                $("#recentChatsDropdownDiv").prepend("<a class=\"dropdown-item text-center\" href=\"#\" onclick=\"replyToId(event)\" value=\"" + recentChats[recentChats.length - 1 - i].id + "\">" + recentChats[recentChats.length - 1 - i].nick + "</a>");
            }
            if ($("#recentChatsDropdownDiv").get(0).childElementCount < recentChats.length) {
                $("#recentChatsDropdownDiv").append("<a class=\"dropdown-item  text-center\" href=\"#\" onclick=\"populateHistory(true)\" >...</a>");
            }
        }
    }
}



////
//  Startup functions
////

var messagesLog = [];

//just loaded page var
var jlPage = true;

//Notification permission var
var isNotificationsAllowed = false;

//Bot username
var thisBot = null;

//Ask notification permission
NotificationsPermisionChecker();

if (localStorage.getItem("AllowNotifications") != null) {
    $("#notificationCheckbox input").prop("checked", (localStorage.getItem("AllowNotifications") == 'true'));
}

if(localStorage.getItem("recentChats") == null){
    localStorage.setItem("recentChats", JSON.stringify([]));
}

var botToken;//var containing the bot token
var lastUpdateId = 11;//Last update id received
setApiToken();//Try to set the token if not setted (it's not forced)

//Check message interval
setInterval(checkNewMessages, 500);

//Save last chat ID
if (typeof (Storage) !== "undefined") {
    if (localStorage.getItem("lastChatID") != null) {
        $("#chatId").val(localStorage.getItem("lastChatID"));
    }
}

populateHistory();


var emojione = $("#textMessage").emojioneArea();



////
//  Event Handlers
////

//Handles notification checkbox change
$('#notificationCheckbox input').change(function () {
    NotificationsPermisionChecker();
});

/// Send Shortcut

//On enter send message
$(document).keypress(function (event) {
    if ((event.keyCode == 10 || event.keyCode == 13) && event.ctrlKey) {
        sendMessage();
    }
});

//Clear the message hostory
//Needs to be fixed - refreshes the page
$('#clearrecentChatss').click(function () {
    $('#chatHistory > tbody > td').remove();
});
