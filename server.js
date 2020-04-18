const path = require('path');
const express = require('express');
const kurento = require('kurento-client');
const http = require('http');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cookie = require('cookie');
const redis = require('redis');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const redisConnect = require("connect-redis");
const compression = require('compression');
const csrfMiddleware = require('csurf');
const xssFilter = require("x-xss-protection");
const lusca = require('lusca');
const dotenv = require("dotenv");
dotenv.config();
const models = require('./models');
const RedisStore = redisConnect(session);
const redisClient = redis.createClient();
const redisStore = new RedisStore({client: redisClient});
const SessionStore = new RedisStore({client: redisClient});
const hour = 3600000;
const expiryDate = new Date(Date.now() + hour); // 1 hour
let sess = {
    store: SessionStore,
    secret: process.env["SESSION_SECRET"],
    resave: false,
    saveUninitialized: false,
    cookie: {
        path: '/',
        /* httpOnly: true,
         secure: false,*/
        expires: expiryDate,
        maxAge: hour
    }
};

const app = express();
app.use(bodyParser.json({limit: '50mb', parameterLimit: 50000}));
app.use(bodyParser.urlencoded({limit: '50mb', parameterLimit: 50000, extended: false}));
app.use(compression({
    filter: function (req, res) {
        return (/json|text|javascript|css|font|svg/).test(res.getHeader('Content-Type'));
    },
    level: 9
}));
app.use(cookieParser());
app.use(session(sess));
app.use(passport.initialize());
app.use(flash());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        let user = await models.User.findByPk(id, {
            attributes: {exclude: ['password']},
            include: [models.Organization]
        });
        if (!user) {
            return done(new Error('user Not found'), null);
        }
        user.dataValues.fullName = user.fullName;
        return done(null, user.dataValues);
    } catch (e) {
        return done(e, null);
    }
});
app.use(
    process.env.NODE_ENV === 'development' ?
        csrfMiddleware({ignoreMethods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT' /* etc */]}) :
        csrfMiddleware()
);
app.use(lusca.nosniff());
app.use(xssFilter({setOnOldIE: true, mode: null}));
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    res.locals.user = req.user;
    res.locals.flashes = req.flash();
    app.locals.moment = require('moment');
    next();
});
app.set('view engine', 'pug');
app.set("views", path.join(__dirname, "views"));
app.use("/public", express.static(path.join(__dirname, "static")));
app.use(express.static(path.join(__dirname, 'static')));

const home = require('./routes/home');
const user = require('./routes/user');
const login = require('./routes/login');
const signup = require('./routes/signup');
const logout = require('./routes/logout');
const organization = require('./routes/organization');

app.use('/', home);
app.use('/users', user);
app.use('/login', login);
app.use('/signup', signup);
app.use('/logout', logout);
app.use('/organization', organization);


app.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err);
    return res.status(403).render("404", {
        error: "Oops! Something went wrong..."
    })
});


// error handler
app.use(function (err, req, res, next) {
    console.log('eer', err)
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    //res.render('404');
});

const server = http.createServer(app).listen(3000, function () {
    console.log('Kurento Tutorial started');
});

let clients = {};
let candidatesQueue = {};
let pipelines = {};

const io = require('socket.io')(server, {
    path: '/kurento',
    origins: '*:*',
    transports: ['websocket', 'polling']
});


io.use(function (socket, next) {
    const handshake = socket.request.headers.cookie;
    if (!handshake) return next(new Error('socket.io: no found cookie'), false);
    const parse_cookie = cookie.parse(handshake);
    const sessionId = cookieParser.signedCookie(parse_cookie['connect.sid'], process.env["SESSION_SECRET"]);
    try {
        return redisStore.load(sessionId, function (err, data) {
            const session = data['passport'];
            if (!session) return next(new Error('socket.io: no found cookie'), false);
            socket.user_id = session.user;
            clients[session.user] = socket.id;
            return next(null, true);
        });
    } catch (e) {
        return next(new Error('socket.io: no found cookie'), false);
    }
});


io.on('connection', async function (socket) {
    const socketId = socket.id;

    let author = await models.User.findByPk(socket.user_id, {
        include: [models.Organization]
    });

    if (author) {
        author.update({socketId: socket.id, online: true}, {where: {id: author.id}});
        let dataEvent = author.last_name + " a rejoint le chat";
        socket.broadcast.emit('jointChat', dataEvent)
    }

    socket.on('chat', async function (message) {
        let receiver = await models.User.findByPk(message.receiver_id);
        const to_socketId = clients[message.receiver_id];
        const sender_id = socket.user_id;
        const chatRoom_id = 1;
        const receiver_id = message.receiver_id;
        const receiver_name = receiver.first_name;
        const sender_name = author.first_name;
        let content = message.content;
        const chat = {
            chatRoom_id,
            sender_name,
            receiver_name,
            receiver_id,
            content,
            sender_id
        };
        await saveMessage(chat);
        io.to(to_socketId).emit('chat', {
            from: author.fullName,
            txt: content
        });
    });

    socket.on('chat:update', () => {
        console.log('chat:update');
    });

    socket.on('leaveChat', function () {
        let dataEvent = author.fullName + "a quitté le chat";
        socket.broadcast.emit('leaveChat', dataEvent)
    });

    socket.on('call', async function (message) {
        return call(socketId, message);
    });

    socket.on('onIceCandidate', async function (message) {
        return onIceCandidate(socket.user_id, message.candidate);
    });

    socket.on('incomingCallResponse', async function (message) {
        return incomingCallResponse(socketId, message);
    });
    socket.on('stop', async function (message) {
        return stop(message);
    });


    socket.on('disconnect', function () {
        let dataEvent = author.last_name + " disconnected";
        //socket.broadcast.emit('Leavejoint', dataEvent);
        author.update({socketId: null, online: false, sdpOffer: null, peer: null}, {where: {id: author.id}});
    });
});

async function saveMessage(chat) {
    try {
        return await models.ChatMessage.create(chat);
    } catch (e) {
        console.log(e)
    }
}

let sdpOfferTest;

async function call(callerSocketId, message) {
    const toId = message.to;
    const fromId = message.from;
    const sdpOffer = message.sdpOffer;
    sdpOfferTest = sdpOffer
    let rejectCause = ``;

    clearCandidatesQueue(fromId);
    try {
        let caller = await models.User.findByPk(fromId);
        let callee = await models.User.findByPk(toId);
        let calleeSocketId = clients[toId];
        if (callee) {
            if (callee.online) {
                callee.update({peer: message.from});
                caller.update({sdpOffer: sdpOffer, peer: toId});
                if (callerSocketId) {
                    return io.to(calleeSocketId).emit('incomingCall', {
                        from: fromId
                    });
                }
            }
            let rejectCause = `l'utilisateur ${callee.first_name} n'est pas connecter`;
            return io.to(callerSocketId).emit('callResponse', {
                response: 'offline',
                message: rejectCause
            });
        }
        rejectCause = `l'utilisateur n'est pas enregistré`;
        return io.to(callerSocketId).emit('callResponse', {
            response: 'rejected: ',
            message: rejectCause
        });

    } catch (e) {
        rejectCause = `err servenue`;
        return io.to(callerSocketId).emit('callResponse', {
            response: 'rejected: ',
            message: rejectCause
        });
    }
}

async function onIceCandidate(userId, _candidate) {
    const candidate = kurento.getComplexType('IceCandidate')(_candidate);
    const user = await models.User.findByPk(userId);
    if (pipelines[user.id] && pipelines[user.id].webRtcEndpoint) {
        let webRtcEndpoint = pipelines[user.id].webRtcEndpoint;
        webRtcEndpoint.addIceCandidate(candidate);
    } else {
        if (!candidatesQueue[user.id]) {
            candidatesQueue[user.id] = [];
        }
        candidatesQueue[user.id].push(candidate);
    }
}

function clearCandidatesQueue(id) {
    if (candidatesQueue[id]) {
        delete candidatesQueue[id];
    }
}


async function incomingCallResponse(socketId, message) {
    console.log('incomingCallResponse', socketId)
    let pipeline;
    const me = message.me;
    const from = message.from;
    const callResponse = message.callResponse;
    clearCandidatesQueue(me);

    if (!from || !me) {
        //return;
    }

    try {
        let callee = await models.User.findByPk(me);
        let caller = await models.User.findByPk(from);

        const callee_socketId = callee.socketId;
        const caller_socketId = caller.socketId;

        if (!callee) {
            const calleeMessage = {
                response: 'rejected'
            };
            return io.to(callee.socketId).emit('callResponse', calleeMessage);
        }

        if (callResponse === 'accept') {
            const kurentoClient = await createKurentoClient();
            pipeline = await createPipeline(kurentoClient);
            try {
                const callerWebRtcEndpoint = await createWebRtcEndpoint(pipeline);
                const calleeWebRtcEndpoint = await createWebRtcEndpoint(pipeline);

                if (candidatesQueue[caller.id]) {
                    while (candidatesQueue[caller.id].length) {
                        let candidate = candidatesQueue[caller.id].shift();
                        callerWebRtcEndpoint.addIceCandidate(candidate);
                    }
                }

                callerWebRtcEndpoint.on('OnIceCandidate', function (event) {
                    let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                    io.to(caller_socketId).emit('iceCandidate', {candidate: candidate});

                });

                if (candidatesQueue[callee.id]) {
                    while (candidatesQueue[callee.id].length) {
                        let candidate = candidatesQueue[callee.id].shift();
                        calleeWebRtcEndpoint.addIceCandidate(candidate);
                    }
                }

                calleeWebRtcEndpoint.on('OnIceCandidate', function (event) {
                    let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                    io.to(callee_socketId).emit('iceCandidate', {candidate: candidate});
                });


                callerWebRtcEndpoint.connect(calleeWebRtcEndpoint, async function (error) {
                    if (error) {
                        console.log(error)
                        pipeline.release();
                        throw error;
                    }

                    calleeWebRtcEndpoint.connect(callerWebRtcEndpoint, async function (error) {
                        if (error) {
                            console.log(error)
                            pipeline.release();
                            throw error;
                        }
                        try {
                            const callerSdpAnswer = await processOffer(callerWebRtcEndpoint, caller.sdpOffer, pipeline, caller.id);
                            const calleeSdpAnswer = await processOffer(calleeWebRtcEndpoint, message.sdpOffer, pipeline, callee.id);
                            io.to(callee_socketId).emit('startCommunication', {sdpAnswer: calleeSdpAnswer});
                            io.to(caller_socketId).emit('callResponse', {
                                response: 'accepted',
                                sdpAnswer: callerSdpAnswer
                            });
                        } catch (e) {
                            console.log(e)
                            if (pipeline) pipeline.release();
                            const calleeMessage = {
                                id: 'stopCommunication'
                            };
                            io.to(callee.socketId).emit('stopCommunication', calleeMessage);
                        }
                    });
                });


            } catch (e) {
                console.log(e)
            }

        } else {
            console.log('kksqnlmkd,jqldmkj,qkls')
            const declineMessage = {
                response: 'rejected',
                message: `${callee.first_name} a refusé votre demande`
            };
            const to_socketId = clients[from];
            io.to(to_socketId).emit('callResponse', declineMessage);
        }

    } catch (e) {
        console.log(e)
        throw e;
    }
}


function createKurentoClient() {
    return new Promise(function (resolve, reject) {
        return kurento("ws://turn.malaika.io:8888/kurento", function (error, _kurentoClient) {
            if (error) {
                console.log('createKurentoClient', error)
                return reject(new Error('Coult not find media server at address ' + ws_uri))
            }
            resolve(_kurentoClient);
        });
    });
}

function createPipeline(kurentoClient) {
    return new Promise(function (resolve, reject) {
        return kurentoClient.create('MediaPipeline', function (error, pipeline) {
            if (error) {
                console.log(error)
                return reject(error);
            }
            resolve(pipeline);
        })
    });
}

function createWebRtcEndpoint(pipeline) {
    return new Promise(function (resolve, reject) {
        pipeline.create('WebRtcEndpoint', function (error, webRtcEndpoint) {
            if (error) {
                console.log(error)
                return reject(error);
            }
            return resolve(webRtcEndpoint);
        });
    })
}

function processOffer(webRtcEndpoint, sdpOffer, pipeline, userId) {
    return new Promise(function (resolve, reject) {
        return webRtcEndpoint.processOffer(sdpOffer, function (error, sdpAnswer) {
            if (error) {
                console.log('error', error)
                pipeline.release();
                reject(error);
            }
            pipelines[userId] = {
                'pipeline': pipeline,
                'webRtcEndpoint': webRtcEndpoint
            };
            webRtcEndpoint.gatherCandidates(function (error) {
                if (error) {
                    console.log(error)
                    reject(error)
                }
            });
            resolve(sdpAnswer);
        });

    })
}


async function stop(message) {
    console.log('stop', message)

    if (!pipelines[message.id]) {
        return;
    }
    console.log('stoip')

    let pipeline = pipelines[message.id];
    delete pipelines[message.id];
    pipeline.release();

    const stopperUser = await models.User.findByPk(message.id);
    const stoppedUser = await models.User.findOne({
        where: {
            peer: stopperUser.peer
        }
    });

    if (stoppedUser) {
        stoppedUser.update({peer: null, sdpOffer: null}, {where: {id: stoppedUser.id}});
        delete pipelines[stoppedUser.id];
        const message = {
            id: 'stopCommunication',
            message: 'remote user hanged out'
        };
        io.to(stoppedUser.socketId).emit('stopCommunication', message);

    }

    clearCandidatesQueue(message.id);

}


process.on('uncaughtException', function (err) {
    console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
    console.error(err.stack)
    //process.exit(1)
});

process.on('exit', (code) => {
    console.log(`Down`);
});
