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
    resave: true,
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
        user.dataValues.fullName = user.fullName;
        if (!user) {
            done(new Error('user Not found'), null);
        }
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


/*// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});*/

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
            socket.userId = session.user;
            clients[session.user] = socket.id;
            return next(null, true);
        });
    } catch (e) {
        return next(new Error('socket.io: no found cookie'), false);
    }
});


io.on('connection', async function (socket) {
    console.log('connection')
    const clientIp = socket.conn.remoteAddress;
    const socketId = socket.id;
    let user = await models.User.findByPk(socket.userId, {
        include: [models.Organization]
    });

    socket.on('jointChat', async function () {
        console.log('jointChat')
        user.update({socketId: socket.id, online: true});
        let dataEvent = user.fullName + " a rejoint le chat";
        socket.broadcast.emit('jointChat', dataEvent)
    });

    socket.on('chat', function (message) {
        let to = clients[message.to];
        let from = clients[user.id];
        io.to(to).emit('chat', {
            from: user.last_name,
            txt: message.txt
        });
    });

    socket.on('chat:update', () => {
        console.log('chat:update');

    });

    socket.on('leaveChat', function () {
        let dataEvent = user.fullName + "a quitté le chat";
        console.log(dataEvent);
        socket.broadcast.emit('jointChat', dataEvent)
    });

    socket.on('call', async function (message) {
        return call(socketId, socket.userId, message);
    });

    socket.on('onIceCandidate', async function (message) {
        return onIceCandidate(socketId, message.candidate);
    });

    socket.on('incomingCallResponse', async function (message) {
        return incomingCallResponse(socketId, message);
    });
    socket.on('stop', async function () {
        return stop(socketId);
    });


    socket.on('disconnect', function () {
        let dataEvent = user.fullName + " disconnected";
        socket.broadcast.emit('jointChat', dataEvent)
    });
});

async function call(callerSocketId, fromUserId, message) {
    const to = message.to;
    clearCandidatesQueue(callerSocketId);

    try {
        let rejectCause = `l'utilisateur ${message.to} n'est pas enregistré`;
        let caller;
        let callee;
        try {
            caller = await models.User.findByPk(fromUserId);
            callee = await models.User.findByPk(to);
            const calleeId = callee.socketId;
            if (callee) {
                callee.update({peer: message.from});
                caller.update({sdpOffer: message.sdpOffer, peer: to});

                try {
                    return io.to(calleeId).emit('incomingCall', {
                        from: fromUserId
                    });
                } catch (exception) {
                    rejectCause = "Error " + exception;
                }
            }

            return io.to(calleeId).emit('callResponse', {
                response: 'rejected: ',
                message: rejectCause
            });
        } catch (e) {
            console.log('e', e);
        }

    } catch (e) {
        return io.to(callerSocketId).emit('error', {
            message: e
        });

    }
}

async function onIceCandidate(sessionId, _candidate) {

    const candidate = kurento.getComplexType('IceCandidate')(_candidate);
    const user = await models.User.findOne({
        where: {
            socketId: sessionId
        }
    });

    if (pipelines[user.socketId] && pipelines[user.socketId].webRtcEndpoint) {
        let webRtcEndpoint = pipelines[user.socketId].webRtcEndpoint;
        webRtcEndpoint.addIceCandidate(candidate);
    } else {
        if (!candidatesQueue[user.socketId]) {
            candidatesQueue[user.socketId] = [];
        }
        candidatesQueue[sessionId].push(candidate);
    }
}

function clearCandidatesQueue(sessionId) {
    if (candidatesQueue[sessionId]) {
        delete candidatesQueue[sessionId];
    }
}


async function incomingCallResponse(calleeId, message) {
    let pipeline;
    clearCandidatesQueue(calleeId);

    let callee = await models.User.findOne({
        where: {
            socketId: calleeId
        }
    });

    const caller = await models.User.findByPk(message.from);

    if (!message.from || !caller) {
        return onError(null, 'unknown from = ' + message.from);
    }
    if (message.callResponse === 'accept') {
        const kurentoClient = await createKurentoClient();
        pipeline = await createPipeline(kurentoClient);

        const callerWebRtcEndpoint = await createWebRtcEndpoint(pipeline);
        const calleeWebRtcEndpoint = await createWebRtcEndpoint(pipeline);

        if (candidatesQueue[caller.socketId]) {
            while (candidatesQueue[caller.socketId].length) {
                let candidate = candidatesQueue[caller.socketId].shift();
                callerWebRtcEndpoint.addIceCandidate(candidate);
            }
        }

        if (candidatesQueue[calleeId]) {
            while (candidatesQueue[calleeId].length) {
                let candidate = candidatesQueue[calleeId].shift();
                calleeWebRtcEndpoint.addIceCandidate(candidate);
            }
        }

        callerWebRtcEndpoint.on('OnIceCandidate', function (event) {
            let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
            io.to(caller.socketId).emit('iceCandidate', {
                candidate: candidate
            });
        });

        calleeWebRtcEndpoint.on('OnIceCandidate', function (event) {
            let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
            io.to(calleeId).emit('iceCandidate', {
                candidate: candidate
            });
        });

        callerWebRtcEndpoint.connect(calleeWebRtcEndpoint, async function (error) {
            if (error) {
                pipeline.release();
                throw error;
            }

            calleeWebRtcEndpoint.connect(callerWebRtcEndpoint, function (error) {
                if (error) {
                    pipeline.release();
                    throw error;
                }
            });

            try {
                const calleeSdpAnswer = await processOffer(calleeWebRtcEndpoint, message.sdpOffer, pipeline, callee.socketId);
                io.to(callee.socketId).emit('startCommunication', {
                    sdpAnswer: calleeSdpAnswer
                });

                const callerSdpAnswer = await processOffer(callerWebRtcEndpoint, caller.sdpOffer, pipeline, caller.socketId);
                io.to(caller.socketId).emit('callResponse', {
                    response: 'accepted',
                    sdpAnswer: callerSdpAnswer
                });
            } catch (e) {
                console.log(e)
            }

        });

    } else {
        const decline = {
            id: 'callResponse',
            response: 'rejected',
            message: "l'utilisateur a refusé votre demande"
        };
        io.to(caller.socketId).emit('callResponse', decline);
    }


    function onError(callerReason, calleeReason) {
        if (pipeline) pipeline.release();
        if (caller) {
            const callerMessage = {
                id: 'callResponse',
                response: 'rejected'
            };
            if (callerReason) callerMessage.message = callerReason;
            return io.to(caller.socketId).emit('callResponse', callerMessage);
        }

        const calleeMessage = {
            id: 'stopCommunication'
        };
        if (calleeReason) calleeMessage.message = calleeReason;
        return io.to(callee.socketId).emit('stopCommunication', calleeMessage);
    }


}


function createKurentoClient() {
    return new Promise(function (resolve, reject) {
        return kurento("ws://turn.malaika.io:8888/kurento", function (error, _kurentoClient) {
            if (error) {
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
                return reject(error);
            }
            return resolve(webRtcEndpoint);
        });
    })
}

function processOffer(webRtcEndpoint, sdpOffer, pipeline, sessionId) {
    return new Promise(function (resolve, reject) {
        return webRtcEndpoint.processOffer(sdpOffer, function (error, sdpAnswer) {
            if (error) {
                pipeline.release();
                reject(error);
            }
            pipelines[sessionId] = {
                'pipeline': pipeline,
                'webRtcEndpoint': webRtcEndpoint
            };
            webRtcEndpoint.gatherCandidates(function (error) {
                if (error) {
                    throw error;
                }
            });
            resolve(sdpAnswer);
        });

    })
}


async function stop(sessionId) {

    if (!pipelines[sessionId]) {
        return;
    }

    var pipeline = pipelines[sessionId];
    console.log('pipeline', pipelines[sessionId])
    delete pipelines[sessionId];
    pipeline.release();

    const stopperUser = await models.User.findOne({
        where: {
            socketId: sessionId
        }
    });
    const stoppedUser = await models.User.findOne({
        where: {
            peer: stopperUser.peer
        }
    });

    if (stoppedUser) {
        stoppedUser.update({peer: null, sdpOffer: null});
        delete pipelines[stoppedUser.socketId];
        const message = {
            id: 'stopCommunication',
            message: 'remote user hanged out'
        };
        io.to(stoppedUser.socketId).emit('stopCommunication', message);

    }

    clearCandidatesQueue(sessionId);

}


process.on('uncaughtException', function (err) {
    console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
    console.error(err.stack)
    process.exit(1)
});

process.on('exit', (code) => {
    console.log(`Down`);
});
