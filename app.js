
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var swig = require('swig');
var crypto = require('crypto');
var shasum = crypto.createHash('sha1');
var indexHTML = "index";
var mysql = require('mysql');

var query_result = null;

var connection = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"pozzerteam2win",
    database:'pozz_test'
});

var app = express();

/* Connect to the database with connection */
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
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({secret: "Pozz secret secret"}));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.bodyParser());
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
            
            var hashing = crypto.createHash('md5').update(user).digest('hex');
//            connection.query('insert into user_session(sid, uid) values (' + hashing + ')', function(err, result) {
//                
//            });
            req.session.sid = hashing;
            res.cookie("sid", hashing).send();
        }
    });
});

function getUserId(username, password)
{
    connection
}

function createSessionId()
{
    
}

/* When user has successfully filled out the information */
app.post('/signup', function(req, res){
    var myParam = [createUID(), req.body.username, req.body.password, req.body.email, getDate()];
    connection.query("insert into users (uid, username, password, email, signdate) values (" + sqlParam(myParam) +  ")",  
        function(err, result){
            if(err == "null" || err == null) {
                console.log("Successfully add a new user");
            } else {
                console.log("Sign up error:" + err);
            }
        
    });
    res.render("search");
});

function sqlParam(param)
{
    var values = "";
    for(var i = 0; i < param.length; i++) {
        values += '"' + param[i] + '", ';
    }
    return values.substring(0, values.lastIndexOf(","));
    
}

function getDate()
{
    var now = new Date();
    return now.getFullYear().toString() + "-" + (now.getMonth() + 1).toString() + "-" + now.getDay().toString();
}


function createUID()
{
    var now = new Date();
    var uid = now.getMonth().toString() + now.getDay().toString() + now.getFullYear().toString() + now.getHours().toString() + now.getMinutes().toString() + now.getSeconds().toString() + now.getMilliseconds().toString();
    uid = parseInt(uid) % 10000000;
    console.log(uid);
    return parseInt(uid);
}

/* When user request a sign up form */
app.get('/signupform', function(req, res) {
    res.render("signup");
    console.log('filing up form');
});
    
//Check database if username already exist
app.post('/veriuser', function(req, res) {
    console.log("verifying username " + req.body.username);
    connection.query('select * from users where username="' + req.body.username + '"', function(err, result){
        if (result && result.length == 0) {
            res.send({verify:"valid", statusText:req.body.username + " is available"}); 
            console.log(req.body.username + " is available");
        } else {
            res.send({verify:"invalid", statusText:req.body.username + " is not available"});
            console.log(req.body.username + " is not available");
        }
    });
//    res.send("seomthing");
});
    
//Check database if email already exist
app.post('/veriemail', function(req, res){
    console.log("verifying email " + req.body.email);
    connection.query('select * from users where email="' + req.body.email + '"', function(err, result){
        if (result && result.length == 0 && verifyEmail(req.body.email)) {
            res.send({verify:"valid", statusText:req.body.email + " is available"}); 
            console.log(req.body.username + " is available");
        } else {
            if(!verifyEmail(req.body.email)) {
                res.send({verify:"invalid", statusText:req.body.email + " is not a valid email address"});
            } else {
                res.send({verify:"invalid", statusText:req.body.email + " is in the system"});
            }
            console.log(req.body.username + " is taken");
        }
    });

});

function verifyEmail(email) 
{
    var atpos = email.indexOf("@");
    var dotpos = email.lastIndexOf(".");
    if(atpos < 1 || dotpos < atpos + 2 || dotpos + 2 >= email.length)
    {
        return false;
    } else {
        return true;
    }
}


/* Email confirmation when user first sign up */
app.get('/email_confirmation', function(req, res) {
    res.send(req.query.eid); 
});

app.get('/search', function(req,res) {
    res.render('search'); 
});


app.get('/', function (req, res) {
    res.render('index', { result:query_result });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
