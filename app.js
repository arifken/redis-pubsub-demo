/**
 * Demo express app that wraps a REST interface around the Redis pub/sub functionality
 */

var express = require('express'),
    http = require('http'),
    path = require('path'),
    redis = require('redis');

// Create an instance of Express (our REST interface)
var app = express();

// Configure Express
app.set('port', process.env.PORT || 3000);
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.errorHandler());


var KEY_PREFIX = 'techtalk:demo:'; // We'll use this key as a prefix for all subscriptions
var redisPort = process.env.REDIS_PORT || 6379;
var redisHost = process.env.REDIS_HOST || '127.0.0.1';


// Create the redis clients (we need different clients for publishing and subscribing)
var subscribeClient = redis.createClient(redisPort, redisHost);
subscribeClient.on('message', function (channel, message) {
    // This is where we would handle an event, when one that we subscribed to has fired
    console.log('\n\n*************\n\nReceived event',channel.replace(KEY_PREFIX,''),'\n\n',message,'\n\n**************');
});

var publishClient = redis.createClient(redisPort, redisHost);


// REST interface for adding a subscription
app.post('/subscribe', function (req, res) {
    var key = req.body.event;

    subscribeClient.subscribe(KEY_PREFIX + key);

    res.json({subscribed:true, event: key});
});


// REST interface for publishing a notification
app.post('/notify', function (req, res) {
    var key = req.body.event,
        payload = req.body.payload || '';

    publishClient.publish(KEY_PREFIX + key, payload);

    res.json({event: key, payload:payload});
});


// Start the REST service
http.createServer(app).listen(app.get('port'), function () {
    console.log('  Express server listening on port ' + app.get('port'));
    console.log('  Redis connected on ' + redisHost + ':' + redisPort);
});
