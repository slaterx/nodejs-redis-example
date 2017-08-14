//  OpenShift sample Node application
var express = require('express'),
    fs      = require('fs'),
    app     = express(),
    eps     = require('ejs'),
    morgan  = require('morgan');
    
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    redisPort = process.env.REDIS_SERVICE_PORT || 6379,
    redisHost = process.env.REDIS_SERVICE_HOST || '127.0.0.1',
    redisUser = process.env.REDIS_USER || 'user',
    redisPassword = process.env.REDIS_PASSWORD || 'password',
    redisDB = process.env.REDIS_DATABASE || 'sampledb';

var redisURL = 'redis://' + redisUser + ':' + redisPassword + '@' + redisHost + ':' + redisPort;

var db = null,
    dbDetails = new Object(),
    client = null,
    count = 0;

var initDb = function(callback) {
    
    var redis = require('redis');
    
    client = redis.createClient(redisURL, {no_ready_check: true});
    
    client.on("error", function (err) {
        callback("Redis connecting error using " + redisURL + " " + err);
        return;
    });
    
    db = true;
    dbDetails.databaseName = redisDB;
    dbDetails.url = redisURL;
    dbDetails.type = 'Redis';
    
    console.log('Connected to Redis at %s', redisHost, ':', redisPort);
};

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    count++;
    client.set('count', count);
    client.get('count', function(err, pageCounter) {
    if (err) {
        console.error("client.get(count) error");
    } else {
        console.log("client.get(count) returned " + pageCounter);
    }
    res.render('index.html', { pageCountMessage : pageCounter, dbInfo: dbDetails });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    res.send('{ pageCount: ' + client.get('count') + '}');
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Redis. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
