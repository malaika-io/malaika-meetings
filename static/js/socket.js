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

const ws = io.connect(url, {
    path: '/kurento',
    transports: ['websocket', 'polling']
});

ws.on('connect', () => {
    console.log('connect')
    ws.emit('jointChat')
});

let videoInput;
let videoOutput;
let webRtcPeer;
let state = null;

const NOT_REGISTERED = 0;
const REGISTERING = 1;
const REGISTERED = 2;
let registerState = null;


const NO_CALL = 0;
const PROCESSING_CALL = 1;
const IN_CALL = 2;
let callState = null;

/*=====================
        Chat
        ==========================*/
(function ($) {
    "use strict";
    $(".messages").animate({scrollTop: $(document).height()}, "fast");
    $('.submit').on('click', function () {
        console.log('kjghfosdhfosifhsidofs')
        typingMessage();
        newMessage();
    });
    $(window).on('keydown', function (e) {
        console.log('kjghfosdhfosifhsidofs')

        if (e.which == 13) {
            if (!e.target.value) {
                return false
            }
            typingMessage();
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
        var message = $('.message-input input').val();
        if ($.trim(message) == '') {
            return false;
        }
        $('<li class="replies"> <div class="media"> <div class="profile mr-4 bg-size" style="background-image: url(&quot;../assets/images/contact/1.jpg&quot;); background-size: cover; background-position: center center;"></div><div class="media-body"> <div class="contact-name"> <h5>Alan josheph</h5> <h6>01:42 AM</h6> <ul class="msg-box"> <li> <h5>' + message + '</h5> </li></ul> </div></div></div></li>').appendTo($('.messages .chatappend'));
        $('.message-input input').val(null);
        $('.chat-main .active .details h6').html('<span>You : </span>' + message);
        $(".messages").animate({scrollTop: $(document).height()}, "fast");
    };

    function typingMessage() {
        $('<li class="sent last typing-m"> <div class="media"> <div class="profile mr-4 bg-size" style="background-image: url(&quot;../assets/images/contact/2.jpg&quot;); background-size: cover; background-position: center center; display: block;"><img class="bg-img" src="../assets/images/contact/2.jpg" alt="Avatar" style="display: none;"></div><div class="media-body"> <div class="contact-name"> <h5>Josephin water</h5> <h6>01:42 AM</h6> <ul class="msg-box"> <li> <h5> <div class="type"> <div class="typing-loader"></div></div></h5> </li></ul> </div></div></div></li>').appendTo($('.messages .chatappend'));
        $(".messages").animate({scrollTop: $(document).height()}, "fast");
        setTimeout(function () {
            $('.typing-m').hide();
            $('<li class="sent"> <div class="media"> <div class="profile mr-4 bg-size" style="background-image: url(&quot;../assets/images/contact/2.jpg&quot;); background-size: cover; background-position: center center; display: block;"></div><div class="media-body"> <div class="contact-name"> <h5>Josephin water</h5> <h6>01:35 AM</h6> <ul class="msg-box"> <li> <h5> Sorry I busy right now, I will text you later </h5> <div class="badge badge-success sm ml-2"> R</div></li></ul> </div></div></div></li>').appendTo($('.messages .chatappend'));
            $(".messages").animate({scrollTop: $(document).height()}, "fast");
        }, 2000);
    }
})(jQuery);

/*
window.onload = function () {
    setRegisterState(NOT_REGISTERED);

    videoInput = document.getElementById('videoInput');
    videoOutput = document.getElementById('videoOutput');


    document.getElementById('call').addEventListener('click', function () {
        call();
    });
    document.getElementById('register').addEventListener('click', function () {
        register();
    });

    document.getElementById('stop').addEventListener('click', function () {
        stop();
    });
    //setState(I_CAN_START);

    /!*$('form').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        ws.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });*!/
};

function setRegisterState(nextState) {
    switch (nextState) {
        case NOT_REGISTERED:
            $('#register').attr('disabled', false);
            $('#call').attr('disabled', true);
            $('#stop').attr('disabled', true);
            break;

        case REGISTERING:
            $('#register').attr('disabled', true);
            break;

        case REGISTERED:
            $('#register').attr('disabled', true);
            setCallState(NO_CALL);
            break;

        default:
            return;
    }
    registerState = nextState;
}

function setCallState(nextState) {
    switch (nextState) {
        case NO_CALL:
            $('#call').attr('disabled', false);
            $('#stop').attr('disabled', true);
            break;

        case PROCESSING_CALL:
            $('#call').attr('disabled', true);
            $('#stop').attr('disabled', true);
            break;
        case IN_CALL:
            $('#call').attr('disabled', true);
            $('#stop').attr('disabled', false);
            break;
        default:
            return;
    }
    callState = nextState;
}


ws.on('connect', () => {
    console.log('connect')
});

ws.on('registerResponse', (message) => {
    resgisterResponse(message);
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
    console.info("Communication ended by remote peer");
    stop(true);
});

ws.on('iceCandidate', (message) => {
    webRtcPeer.addIceCandidate(message.candidate)
});

ws.on('error', (parsedMessage) => {
    // if (state === I_AM_STARTING) {
    //     setState(I_CAN_START);
    // }
    onError('Error message from server: ' + parsedMessage.message);
});

ws.on('chat message', function (msg) {
    console.log('msg', msg)
    $('#messages').append($('<li>').text(msg));
});

ws.on('connect_error', function (parsedMessage) {
    onError('Unrecognized message', parsedMessage);
});

function call() {
    console.log('Starting video call ...')

    if (document.getElementById('peer').value === '') {
        window.alert("You must specify the peer name");
        return;
    }

    setCallState(PROCESSING_CALL);

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
        mediaConstraints: constraints
    };

    webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function (error) {
        if (error) {
            console.error(error);
            setCallState(NO_CALL);
        }
        this.generateOffer(onOffer);
    });
}

function onOffer(error, offerSdp) {
    //if (error) return onError(error);
    if (error) {
        console.error(error);
        setCallState(NO_CALL);
    }

    //console.info('Invoking SDP offer callback function ' + location.host);
    const message = {
        id: 'call',
        from: document.getElementById('name').value,
        to: document.getElementById('peer').value,
        sdpOffer: offerSdp
    };
    sendMessage(message);
}


function onIceCandidate(candidate) {
    console.log('Local candidate' + JSON.stringify(candidate));

    const message = {
        id: 'onIceCandidate',
        candidate: candidate
    };
    // Send the candidate to the remote peer
    sendMessage(message);
}

function callResponse(message) {
    if (message.response !== 'accepted') {
        console.info('Call not accepted by peer. Closing call');
        const errorMessage = message.message ? message.message
            : 'Unknown reason for call rejection.';
        console.log(errorMessage);
        stop(true);
    } else {
        setCallState(IN_CALL);
        webRtcPeer.processAnswer(message.sdpAnswer);
    }
}

function incomingCall(message) {
    let response;
// If bussy just reject without disturbing user
    if (callState !== NO_CALL) {
        response = {
            id: 'incomingCallResponse',
            from: message.from,
            callResponse: 'reject',
            message: 'bussy'

        };
        return sendMessage(response);
    }

    setCallState(PROCESSING_CALL);
    if (confirm('User ' + message.from
        + ' is calling you. Do you accept the call?')) {
        showSpinner(videoInput, videoOutput);

        const options = {
            localVideo: videoInput,
            remoteVideo: videoOutput,
            onicecandidate: onIceCandidate
        };

        webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
            function (error) {
                if (error) {
                    console.error(error);
                    setCallState(NO_CALL);
                }

                this.generateOffer(function (error, offerSdp) {
                    if (error) {
                        console.error(error);
                        setCallState(NO_CALL);
                    }
                    const response = {
                        id: 'incomingCallResponse',
                        from: message.from,
                        callResponse: 'accept',
                        sdpOffer: offerSdp
                    };
                    sendMessage(response);
                });
            });

    } else {
        response = {
            id: 'incomingCallResponse',
            from: message.from,
            callResponse: 'reject',
            message: 'user declined'
        };
        sendMessage(response);
        stop(true);
    }
}

function startCommunication(message) {
    setCallState(IN_CALL);
    webRtcPeer.processAnswer(message.sdpAnswer);
}

function stop(message) {
    setCallState(NO_CALL);
    if (webRtcPeer) {
        webRtcPeer.dispose();
        webRtcPeer = null;

        if (!message) {
            let message = {
                id: 'stop'
            };
            sendMessage(message);
        }
    }
    hideSpinner(videoInput, videoOutput);
}

function onError(error) {
    console.log(error);
}


function sendMessage(message) {
    ws.emit(message.id, message);
}

function register() {
    const name = document.getElementById('name').value;
    if (name === '') {
        window.alert("Vous devez insérer votre nom d'utilisateur");
        return;
    }

    setRegisterState(REGISTERING);

    const message = {
        id: 'register',
        name: name
    };
    sendMessage(message);
    document.getElementById('peer').focus();
}

function resgisterResponse(message) {
    if (message.response === 'accepted') {
        localStorage.setItem('id', message.id);
        setRegisterState(REGISTERED);
        alert('Ok ');
    } else {
        setRegisterState(NOT_REGISTERED);
        const errorMessage = message.message ? message.message : 'Raison inconnue du rejet du registre.';
        alert(errorMessage);
    }
}


function showSpinner() {
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].poster = './img/transparent-1px.png';
        arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
    }
}

function hideSpinner() {
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].src = '';
        arguments[i].poster = './img/webrtc.png';
        arguments[i].style.background = '';
    }
}
*/
