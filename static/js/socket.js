//const url = 'https://turn.malaika.io';
const url = 'http://' + location.host;
const OneSignal = window.OneSignal || [];
if (url === "https://turn.malaika.io") {
    OneSignal.push(function () {
        OneSignal.init({
            appId: "33332867-5fd8-4785-846d-bcebf163bfef",
        });
    });
}
let videoInput;
let videoOutput;
let webRtcPeer;
let state = null;

videoInput = document.getElementById('videoInput');
videoOutput = document.getElementById('videoOutput');
document.getElementById('call').addEventListener('click', function () {
    call();
});
document.getElementById('stop').addEventListener('click', function () {
    stop();
});

const ws = io.connect(url, {
    path: '/kurento',
    transports: ['websocket', 'polling']
});

ws.on('connect', () => {
    console.log('connect')
    ws.emit('jointChat')
});

ws.on('jointChat', (message) => {
    console.log(message)
});

ws.on('chat', (message) => {
    console.log(message)
    $('<li class="sent last typing-m"> <div class="media"> <div class="profile mr-4 bg-size" style="background-image: url(&quot;/public/images/contact/2.jpg&quot;); background-size: cover; background-position: center center; display: block;"><img class="bg-img" src="/public/images/contact/2.jpg" alt="Avatar" style="display: none;"></div><div class="media-body"> <div class="contact-name"> <h5>' + message.from + '</h5> <h6>01:42 AM</h6> <ul class="msg-box"> <li> <h5> <div class="type"> <div class="typing-loader"></div></div></h5> </li></ul> </div></div></div></li>').appendTo($('.messages .chatappend'));
    $(".messages").animate({scrollTop: $(document).height()}, "fast");
    setTimeout(function () {
        $('.typing-m').hide();
        $('<li class="sent"> <div class="media"> <div class="profile mr-4 bg-size" style="background-image: url(&quot;../assets/images/contact/2.jpg&quot;); background-size: cover; background-position: center center; display: block;"></div><div class="media-body"> <div class="contact-name"> <h5>' + message.from + '</h5> <h6>01:35 AM</h6> <ul class="msg-box"> <li> <h5>' + message.txt + '</h5> <div class="badge badge-success sm ml-2"> R</div></li></ul> </div></div></div></li>').appendTo($('.messages .chatappend'));
        $(".messages").animate({scrollTop: $(document).height()}, "fast");
    }, 2000)
});


ws.on('callResponse', (parsedMessage) => {
    callResponse(parsedMessage);
});

ws.on('incomingCall', (parsedMessage) => {
    incomingCall(parsedMessage);
});

ws.on('startCommunication', (parsedMessage) => {
    startCommunication(parsedMessage);
});

ws.on('stopCommunication', (parsedMessage) => {
    stop(true);
});

ws.on('iceCandidate', (message) => {
    webRtcPeer.addIceCandidate(message.candidate)
});


(function ($) {
    "use strict";
    $(".messages").animate({scrollTop: $(document).height()}, "fast");
    $('.submit').on('click', function () {
        newMessage();
    });
    $(window).on('keydown', function (e) {
        if (e.which == 13) {
            if (!e.target.value) {
                return false
            }
            newMessage();
            return false;
        }
    });

    $(".emojis-sub-contain ul li").click(function () {
        var number = $(this).html();
        $("#setemoj").focus().val(function () {
            return this.value + number;
            $(".messages").animate({
                scrollTop: $(document).height()
            }, "fast");
        });
        $('#send-msg').removeClass('disabled').removeAttr("disabled")
    });


    $('#send-msg').addClass('disabled').attr("disabled", "disabled")
    $("#setemoj").keyup(function (e) {
        if (!e.target.value) {
            $('#send-msg').addClass('disabled').attr("disabled", "disabled")
        } else {
            $('#send-msg').removeClass('disabled').removeAttr("disabled")
        }
    });

    function newMessage() {
        let message = $('.message-input input').val();
        if ($.trim(message) == '') {
            return false;
        }
        let pageURL = window.location.href;
        let receiver_id = pageURL.substr(pageURL.lastIndexOf('/') + 1);
        ws.emit('chat', {
            content: message,
            receiver_id: receiver_id
        });
        $('<li class="replies"> <div class="media"> <div class="profile mr-4 bg-size" style="background-image: url(&quot;../images/contact/1.jpg&quot;); background-size: cover; background-position: center center;"></div><div class="media-body"> <div class="contact-name"> <h5>Moi</h5> <h6>01:42 AM</h6> <ul class="msg-box"> <li> <h5>' + message + '</h5> </li></ul> </div></div></div></li>').appendTo($('.messages .chatappend'));
        $('.message-input input').val(null);
        $('.chat-main .active .details h6').html('<span>You : </span>' + message);
        $(".messages").animate({scrollTop: $(document).height()}, "fast");
    };


})(jQuery);

function call() {
    console.log('Starting video call ...')
    showSpinner(videoInput, videoOutput);

    const constraints = {
        audio: true,
        video: {
            width: 640,
            framerate: 15
        }
    };

    const options = {
        localVideo: videoInput,
        remoteVideo: videoOutput,
        onicecandidate: onIceCandidate,
        //mediaConstraints: constraints
    };

    webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function (error) {
        if (error) {
            console.error(error);
        }
        this.generateOffer(onOffer);
    });
}

function onOffer(error, offerSdp) {
    let pageURL = window.location.href;
    let toId = pageURL.substr(pageURL.lastIndexOf('/') + 1);
    console.log('ToId',toId)
    const message = {
        to: toId,
        sdpOffer: offerSdp
    };
    ws.emit('call', message);
}

function onIceCandidate(candidate) {
    const message = {
        id: 'onIceCandidate',
        candidate: candidate
    };
    ws.emit('onIceCandidate', message);
}

function callResponse(message) {
    if (message.response !== 'accepted') {
        console.info('Call not accepted by peer. Closing call');
        const errorMessage = message.message ? message.message
            : 'Unknown reason for call rejection.';
        console.log(errorMessage);
        stop(true);
    } else {
        webRtcPeer.processAnswer(message.sdpAnswer);
    }
}

function incomingCall(message) {
    $('#confercall').modal();
    document.getElementById('accept-call').addEventListener('click', function () {
        $('#confercall').modal('hide');
        $('#videocall').modal();
        const options = {
            localVideo: videoInput,
            remoteVideo: videoOutput,
            onicecandidate: onIceCandidate
        };
        webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function (error) {
            if (error) {
                console.error(error);
            }

            this.generateOffer(function (error, offerSdp) {
                if (error) {
                    console.error(error);
                }
                const response = {
                    id: 'incomingCallResponse',
                    from: message.from,
                    callResponse: 'accept',
                    sdpOffer: offerSdp
                };
                ws.emit('incomingCallResponse', response)
            });
        });
    });
    /*
    else {
        response = {
            id: 'incomingCallResponse',
            from: message.from,
            callResponse: 'reject',
            message: 'user declined'
        };
        sendMessage(response);
        stop(true);
    }
     */
}

function startCommunication(message) {
    webRtcPeer.processAnswer(message.sdpAnswer);
}

function stop(message) {
    if (webRtcPeer) {
        webRtcPeer.dispose();
        webRtcPeer = null;

        if (!message) {
            ws.emit('stop', {})
        }
    }
    hideSpinner(videoInput, videoOutput);
}

function showSpinner() {
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].poster = './images/transparent-1px.png';
        arguments[i].style.background = 'center transparent url("./images/spinner.gif") no-repeat';
    }
}

function hideSpinner() {
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].src = '';
        arguments[i].poster = './images/webrtc.png';
        arguments[i].style.background = '';
    }
}
