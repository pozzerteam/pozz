
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
var mailer = require('express-mailer');
var query_result = null;
var app = express();


//Set up database
var connection = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"pozzerteam2win",
    database:'pozz_test'
});

//mailer sends out email from the app
mailer.extend(app, {
    from: 'no-repy@gmail.com',
    host: 'smtp.gmail.com',
    secureConnection:true,
    port:465,
    transportMethod: 'SMTP',
    auth: {
        user:'pozzerteam',
        pass:'pozzerteam2win'
    }
})

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

/*  Search page */
app.get('/search', function(req,res) {
    //if user already login
    if(req.session.sid) {
        res.render('search', {signedin:true, username:req.session.username});
    } else {
        res.render('search', {signedin:false, username:""}); 
    }
    //if first time visitor
});

/* Index page */
app.get('/', function (req, res) {
    res.render('index', { result:query_result });
});


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
            req.session.username = req.body.username;
            res.cookie("sid", hashing).send();
        } else {
            res.send("Not working");
        }
    });
});


/* When user has successfully filled out the information */
app.post('/signup', function(req, res){
    var myParam = [createUID(), req.body.username, req.body.password, req.body.email, getDate()];
    var sql_stm = {
        tbname: "users",
        params:["uid", "username", "password", "email", "signdate"],
        values:myParam
    }
    connection.query(insertInto(sql_stm),  
        function(err, result){
            var hashing = crypto.createHash('md5').update(req.body.username).digest('hex');
            if(err == "null" || err == null) {
                req.session.sid = hashing;
                req.session.username = req.body.username;
                console.log("Successfully added a new user");
                res.cookie("sid", hashing);
                res.cookie("username", req.body.username);
                res.mailer.send("emailconf", {
                    to:req.body.email,
                    subject: "Please confirm your email",
                    username:req.body.username,
                    confirm_link: "http://www.google.com"
                }, function (err) {
                    if(err){
                        console.log("There was an erro sending the email");
                        return;
                    } else {
                        console.log("Confirmation email sent");
                    }
                });
                
                res.render("search", {signedin:true, username:req.session.username});
            } else {
                console.log("Sign up error:" + err);
                res.render("signupform");
            }
        
    });
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
    res.render("signupform");
    console.log('filing up form');
});
    
//A post request that checks if user name exists in database
app.post('/veriuser', function(req, res) {
    console.log("verifying username " + req.body.username);
    
    if(req.body.username.length < 4) {
        res.send({verify:0, statusText:"Username should be at least 4 characters"});
    } else if(req.body.username.length > 9) {
        res.send({verify:0, statusText:"Username cannot be more than 9 characters"});
    } else {
        connection.query('select * from users where username="' + req.body.username + '"', function(err, result){
            if (result && result.length == 0) {
                res.send({verify:1, statusText:req.body.username + " is available"}); 
            } else {
                res.send({verify:0, statusText:req.body.username + " has been taken"});
            }
        });
    }
//    res.send("seomthing");
});


/* Profile Page */
app.get('/profile', function(req, res){
        
    res.render("profile");
});
    
//A post request that checkes if email is already in database
app.post('/veriemail', function(req, res){
    console.log("verifying email " + req.body.email);
    connection.query('select * from users where email="' + req.body.email + '"', function(err, result){
        if (result && result.length == 0 && verifyEmail(req.body.email)) {
            res.send({verify:"valid", statusText:req.body.email + " is good"}); 
            console.log(req.body.username + " is available");
        } else {
            if(!verifyEmail(req.body.email)) {
                res.send({verify:1, statusText:req.body.email + " is not a valid email address"});
            } else {
                res.send({verify:0, statusText:req.body.email + " is already in the system"});
            }
//            console.log(req.body.username + " is taken");
        }
    });

});

app.post('/veripassword', function(req, res){
    var upperCase = new RegExp('[A-Z]');
    var lowerCase = new RegExp('[a-z]');
    var numbers = new RegExp('[0-9]');
    var pass = req.body.password;
    if(pass.match(upperCase) && pass.match(lowerCase) && pass.match(numbers)) {
        res.send({verify:1, statusText:"You've got a strong password!"});
    } else {
        res.send({verify:0, statusText:"Password must be between 6 to 20 characters with at least 1 lowercase, 1 uppercase and 1 number character"});
    }
});



// A function that verifies email based on the existence of a dot and @ symbol
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

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

/*  tbname:string
    params:array of strings
    values:array of strings
    format -> JSON
    Convert a JSON object into mysql
*/
function insertInto(myJSON)
{
    var mysql_stm = "insert into " + myJSON.tbname + " (";
    for(var i = 0; i < myJSON.params.length; i++) {
        mysql_stm += myJSON.params[i] + ',';
    }
    mysql_stm = mysql_stm.substring(0, mysql_stm.length - 1) + ") values (";
    for(var i = 0; i < myJSON.values.length; i++) {
        mysql_stm += '"' + myJSON.values[i] + '",'
    }
    mysql_stm = mysql_stm.substring(0, mysql_stm.length - 1) + ")";
    return mysql_stm;
}

