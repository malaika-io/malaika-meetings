const path = require('path');
const express = require('express');
const kurento = require('kurento-client');
const http = require('http');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const createError = require('http-errors')
const redis = require('redis');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const redisConnect = require("connect-redis");
const compression = require('compression');
const csrfMiddleware = require('csurf');
const xssFilter = require("x-xss-protection");
var LocalStrategy = require('passport-local').Strategy;
const lusca = require('lusca');
const dotenv = require("dotenv");
dotenv.config();
var cookie = require('cookie')
const models = require('./model');
const authCtl = require('./auth.controller');
const RedisStore = redisConnect(session);
const {check} = require('express-validator')
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

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect("/login")
};

const isNotAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/organization');
    }
    next();
};


app.get('/', isNotAuthenticated, function (req, res) {
    res.render('landing');
});

app.get('/login', isNotAuthenticated, function (req, res) {
    res.render('login');
});

app.get('/organization', isAuthenticated, function (req, res) {
    const organizationName = req.user.Organization.name;
    res.redirect('organization/' + organizationName);
});

app.get('/organization/:name', isAuthenticated, function (req, res) {
    res.render('admin');
});

app.post('/login', [
    // username must be an email
    check("email", "Empty email").isEmail(),
    check('password', "Le mots de passe n'est pas correcte").isLength({min: 5})
], authCtl.login);


app.get('/signup', isNotAuthenticated, function (req, res) {
    res.render('signup');
});
app.post('/signup', [
    // username must be an email
    check("email", "L'adresse email n'est pas correcte").isEmail(),
    check("first_name", "Empty first_name").not().isEmpty(),
    check("last_name", "Empty last_name").not().isEmpty(),
    check("organization", "Empty organization").not().isEmpty(),
    check('password', "Le mots de passe n'est pas correcte").isLength({min: 5})
], authCtl.register);

app.get('/logout', isAuthenticated, authCtl.logout);


app.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err);
    return res.status(403).render("404", {
        error: "Oops! Something went wrong..."
    })
});


const server = http.createServer(app).listen(3000, function () {
    console.log('Kurento Tutorial started');
});

let clients = {};

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

//const nsp = io.of('/my-namespace');

io.on('connection', async function (socket) {
    const clientIp = socket.conn.remoteAddress;
    const socketId = socket.id;
    let user = await models.User.findByPk(socket.userId);

    socket.on('jointChat', async function () {
        user.update({socketId: socket.id, online: true});
        let dataEvent = user.fullName + " a rejoint le chat";
        console.log(dataEvent);
        // sending to all clients in namespace 'myNamespace', including sender
        io.of('myNamespace').emit('jointChat', dataEvent)
    });

    socket.on('chat', function (chat) {

    });

    socket.on('chat:update', () => {
        console.log('chat:update');

    });

    socket.on('leaveChat', function () {
        let dataEvent = user.fullName + "a quitté le chat";
        console.log(dataEvent);
    });


    socket.on('disconnect', function () {
        let dataEvent = user.fullName + " disconnected";
    });
});


/*
let candidatesQueue = {};
let pipelines = {};

io.on('connection', async function (socket) {
    console.log('connection')
    const sessionId = socket.id;

    socket.on('register', async function (message) {
        return register(sessionId, message.name, socket);
    });

    socket.on('call', async function (message) {
        return call(sessionId, message);
    });

    socket.on('incomingCallResponse', async function (message) {
        return incomingCallResponse(sessionId, message);
    });

    socket.on('onIceCandidate', async function (message) {
        return onIceCandidate(sessionId, message.candidate);
    });

    socket.on('chat message', function (msg) {
        console.log('message: ' + msg);
        socket.emit('chat message', msg);
        //socket.broadcast.emit('hi');
    });

    socket.on('disconnect', async function () {
        return stop(sessionId);
    });

    socket.on('stop', async function () {
        return stop(sessionId);
    });
});

async function register(sessionId, name, socket) {

    function onError(error) {
        socket.emit('registerResponse', {response: 'rejected ', message: error});
    }

    if (!name) {
        return onError("nom d'utilisateur vide");
    }

    try {
        const user = await models.User.create({user_name: name, sessionId: sessionId});
        socket.emit('registerResponse', {response: 'accepted', id: user.id});
    } catch (e) {
        if (e.name === 'SequelizeUniqueConstraintError') {
            return onError("Ce nom d'utilisateur est déjà utilisé. Essayez un autre nom");
        }
        onError(e);
    }
}

async function call(callerSocketId, message) {
    const to = message.to;
    const from = message.from;

    clearCandidatesQueue(callerSocketId);

    try {
        let rejectCause = `l'utilisateur ${message.to} n'est pas enregistré`;
        let caller;
        let callee;
        try {
            caller = await models.User.findOne({
                where: {
                    sessionId: callerSocketId
                }
            });
            callee = await models.User.findOne({
                where: {
                    user_name: to
                }
            });
            const calleeId = callee.sessionId;
            if (callee) {
                callee.update({peer: message.from});
                caller.update({sdpOffer: message.sdpOffer, peer: message.to});

                try {
                    return io.to(calleeId).emit('incomingCall', {
                        from: message.from
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

async function incomingCallResponse(calleeId, message) {

    let pipeline;
    clearCandidatesQueue(calleeId);

    let callee = await models.User.findOne({
        where: {
            sessionId: calleeId
        }
    });

    const caller = await models.User.findOne({
        where: {
            user_name: message.from
        }
    });

    if (!message.from || !caller) {
        return onError(null, 'unknown from = ' + message.from);
    }
    if (message.callResponse === 'accept') {
        const kurentoClient = await createKurentoClient();
        pipeline = await createPipeline(kurentoClient);

        const callerWebRtcEndpoint = await createWebRtcEndpoint(pipeline);
        const calleeWebRtcEndpoint = await createWebRtcEndpoint(pipeline);

        if (candidatesQueue[caller.sessionId]) {
            while (candidatesQueue[caller.sessionId].length) {
                let candidate = candidatesQueue[caller.sessionId].shift();
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
            io.to(caller.sessionId).emit('iceCandidate', {
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
                const calleeSdpAnswer = await processOffer(calleeWebRtcEndpoint, message.sdpOffer, pipeline, callee.sessionId);
                io.to(callee.sessionId).emit('startCommunication', {
                    sdpAnswer: calleeSdpAnswer
                });

                const callerSdpAnswer = await processOffer(callerWebRtcEndpoint, caller.sdpOffer, pipeline, caller.sessionId);
                io.to(caller.sessionId).emit('callResponse', {
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
        io.to(caller.sessionId).emit('callResponse', decline);
    }


    function onError(callerReason, calleeReason) {
        if (pipeline) pipeline.release();
        if (caller) {
            const callerMessage = {
                id: 'callResponse',
                response: 'rejected'
            };
            if (callerReason) callerMessage.message = callerReason;
            return io.to(caller.sessionId).emit('callResponse', callerMessage);
        }

        const calleeMessage = {
            id: 'stopCommunication'
        };
        if (calleeReason) calleeMessage.message = calleeReason;
        return io.to(callee.sessionId).emit('stopCommunication', calleeMessage);
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
                console.log(error)
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
    delete pipelines[sessionId];
    pipeline.release();

    const stopperUser = await models.User.findOne({
        where: {
            sessionId: sessionId
        }
    });
    const stoppedUser = await models.User.findOne({
        where: {
            peer: stopperUser.peer
        }
    });

    if (stoppedUser) {
        stoppedUser.update({peer: null, sdpOffer: null});
        delete pipelines[stoppedUser.sessionId];
        const message = {
            id: 'stopCommunication',
            message: 'remote user hanged out'
        };
        io.to(stoppedUser.sessionId).emit('stopCommunication', message);

    }

    clearCandidatesQueue(sessionId);

}

function clearCandidatesQueue(sessionId) {
    if (candidatesQueue[sessionId]) {
        delete candidatesQueue[sessionId];
    }
}

async function onIceCandidate(sessionId, _candidate) {

    const candidate = kurento.getComplexType('IceCandidate')(_candidate);
    const user = await models.User.findOne({
        where: {
            sessionId: sessionId
        }
    });

    if (pipelines[user.sessionId] && pipelines[user.sessionId].webRtcEndpoint) {
        let webRtcEndpoint = pipelines[user.sessionId].webRtcEndpoint;
        webRtcEndpoint.addIceCandidate(candidate);
    } else {
        if (!candidatesQueue[user.sessionId]) {
            candidatesQueue[user.sessionId] = [];
        }
        candidatesQueue[sessionId].push(candidate);
    }
}
*/


process.on('uncaughtException', function (err) {
    console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
    console.error(err.stack)
    process.exit(1)
});

process.on('exit', (code) => {
    console.log(`Down`);
});
