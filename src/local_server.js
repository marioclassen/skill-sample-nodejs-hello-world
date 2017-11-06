'use strict';

const express         = require('express');
const fs              = require('fs');
const context 		    = require('aws-lambda-mock-context');
const httpHelper	    = require('./modules/httpHelper');
const config          = require("./config")();
const helmet          = require('helmet');
const verifier        = require('alexa-verifier-middleware');
const http            = require('http');

// lambda.js contains the lambda function for Alexa as in https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs
const lambda          = require('./index');
const app             = express();

const port = 8888;

require('instana-nodejs-sensor')({
  agentHost: '172.17.0.1', // use IPv6 to contact via localhost
});

var alexaRouter = express.Router()
app.use('/skill', alexaRouter)

// attach the verifier middleware first because it needs the entire
// request body, and express doesn't expose this on the request object
alexaRouter.use(verifier)
app.use(helmet()); //secure

alexaRouter.post('/', function (req, res) {
    var ctx = context({
        timeout: 60
    });
    lambda.handler(req.body,ctx);
    ctx.Promise
        .then(resp => {  return res.status(200).json(resp); })
        .catch(err => {  console.log(err); })
});

let httpServer = http.createServer(app);

// switch env just to give a signal
switch (process.env.NODE_ENV) {

    default:
    case 'development':
        console.log('Starting development environment...');

        httpServer.listen(port, function () {
            console.log('Server is listing on HTTP port ' + port);
        });
        break;
}
