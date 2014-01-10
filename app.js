
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var swig = require('swig');
var mysql = require('mysql');
var hash = require('./public/javascripts/sha1.js');

var query_result = null;

var connection = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:''
});

var app = express();

connection.connect(function(err){
    if(err === "null") {
        console.log("Error connecting to database: " + err); 
    } else {
        console.log("Successfully connected to database!");
    }
});

connection.query('select * from post', function(err, result){
    query_result = result;
});

// all environments
app.set('port', process.env.PORT || 3000);
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.cookieParser());
app.use(express.session({}));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


function q(name)
{
    return '"' + name + '", ';
}

/* Handles the request when user submits a post */
/* Check for potential sql injection */
app.post('/createpost', function(req, res) {
    var id = req.body.id;
    var title = req.body.title;
    var price = req.body.price;
    var description = req.body.description;
    var days = req.body.days;
    console.log(id + " " + title + " " + price + " " + description +  " " + days);
});

app.post('/login', function(req, res) {
    var user = req.body.username;
    var pass = req.body.password;
    var response = res;
    connection.query('select password from users where username="' + user + '"', function(err, result){
        if(result[0]['password'] == pass) {
            res.send();
        }
//        console.log(pass);
//        console.log(result[0]['password']);
//        console.log("authenticating...");
    });
});

app.get('/radical', function(req, res){
    res.send("what a radical");
});

//app.get('/', routes.index);
//app.get('/users', user.list);
app.get('/', function (req, res) {
//    console.log(query_result);
    res.render('search', { result:query_result });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
