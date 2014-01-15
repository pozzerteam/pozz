
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

/* Constant values */
var password_verification_text = ["Between 6 to 20 characters", "Contains 1 upper case letter", "Contains 1 lower case letter", "Contains 1 numeric character"];
var upperCase = new RegExp('[A-Z]');
var lowerCase = new RegExp('[a-z]');
var numbers = new RegExp('[0-9]');

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
    console.log("session id:" + req.session.id);
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
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});



/* Email confirmation when user first sign up */
app.get('/email_confirmation', function(req, res) {
    var hashValue = req.query.eid;
    console.log(hashValue);
    //Check if the confirmation hash is verified
    connection.query('select confirmed from email_confirmation where eid="' + hashValue + '"',              function(err, result) {
            //Confirm the hash value
            if(result[0]['confirmed'] == 0) {
                connection.query('update email_confirmation set confirmed=1 where eid="' + hashValue                                + '"', function(err, result){
                    if (is_null(err)){
                        res.send("Email confirmed!");   
                    }
                });
            } else if(result[0]['confirmed'] == 1){
                res.send("Your email hash already been confirmed!");
                //hash value has been previously confirmed
            } else {
                
                res.send("Your confirmation email is not quite right....?");
                //There is no such eid          
            }      
            console.log("result:" + JSON.stringify(result));
    }); 
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
    var response = res.
    connection.query('select password from users where username="' + user + '"', function(err, result){
        if(result[0]['password'] == pass) {
            
            var hashing = crypto.createHash('md5').update(user).digest('hex');
            req.session.sid = hashing;
            req.session.username = req.body.username;
            res.cookie("sid", hashing).send();
        } else {
            res.send("Not working");
        }
    });
});




/*  
    A process that verifies user's sign up form, and redirect to the appropriate page
*/
app.post('/signup', function(req, res){
    var uid = createUID();
    var isVerified = false;
    verifySubmittedForm(req.body.username, req.body.email, req.body.password, function(isValid) {
        //if all the fields are correct
        if(isValid) {
            
            var sql_param = [createUID(), req.body.username, req.body.password, req.body.email, getDate()];
            //Preparing for sql query
            var sql_stm = {
                tbname: "users",
                params:["uid", "username", "password", "email", "signdate"],
                values:sql_param
            }
            //Add user to the database, send them an email confirmation link
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
                        confirm_link: 'http://localhost:3000/email_confirmation?eid=' + hashing
                    }, function (err) {
                        if(err){
                            console.log("There was an error sending the email");
                            return;
                        } else {
                            var stm = {
                                tbname: "email_confirmation",
                                params:["eid", "uid", "confirmed"],
                                values:[hashing, uid, 0]
                            }
                            connection.query(insertInto(stm), function(err, result){
                               if(err){
                                   console.log("confirmation error: cannot insert confirmation detail into database");
                               } 
                            });
                            console.log("Confirmation email sent");
                        }
                    });
                    
                    res.render("search", {signedin:true, username:req.session.username});
                } else {
                    console.log("Sign up error:" + err);
                }
            });
                
        } else {
            res.render("signupform", {needfix:true, username:req.body.username,                                             email:req.body.email, error_message:"Either username, password or email is not valid, please check again!"});
        }
    });
});



/* Renders a sign up from template */
app.get('/signupform', function(req, res) {
    res.render("signupform");
});
    

/* Renders a profile page from template */
app.get('/profile', function(req, res){
    res.render("profile");
});

/* A process that verifies user input and return appropriate response */
app.post('/verify', function(req, res){
    var value = req.body.value;
    var data;
    console.log(req.body.type);
    switch(req.body.type)
    {
            case 'text':
                verifyUser(value, function(isData, message){
                    res.send({verify:isData, statusText:message});
                });
                break;
            case 'email':
                verifyEmail(value, function(isEmail, message){
                    res.send({verify:isEmail, statusText:message}); 
                });
                break;
            case 'password':
                data = verifyPassword(value)[0];
                res.send({verify:data.pass, statusText:data.log});
                break;
            default:
                break;
    }
});


/* A function that verify user password */
function verifyPassword(pass)
{
    var isValidPassword = 1;
    
    //Check if password length is in the right range
    var isLength = ((pass.length >= 6 && pass.length <= 20)? true : false);
    
    //An array that holds boolean value that indicate each form's  passing status
    var instruction_pass = [isLength, upperCase.test(pass), lowerCase.test(pass), numbers.test(pass)];
    
    //Construct instructions for password
    var param = "<ul>";
    for (var i = 0; i < instruction_pass.length; i++) {
        if (instruction_pass[i]){
            param += "<strike><li>" + password_verification_text[i]  + "</li></strike>";
        } else {
            isValidPassword = 0;
            param += "<li>" + password_verification_text[i] + "</li>";
        }
    }
    if (isValidPassword) {
       param = "You've got a strong password"; 
    }
    return [{pass:isValidPassword, log:param}];
}


/* A function that verify if user already exists in database */
function verifyUser(username, callback)
{
    var isUser = 1;
    var param =  "";
    if (username.length < 4 || username.length > 10) {
        isUser = 0;
        param = "Username should be between 4 to 10 characters long"
        callback(isUser, param);
    } 
    connection.query('select * from users where username="' + username + '"',                                   function(err, result){
            if (result && result.length == 0) {
                callback(isUser, username + " is available");
            } else {
                isUser = 0;
                callback(isUser, username + " has been taken");
            }
    });
}


// A function that verifies email based on the existence of a dot and @ symbol
function verifyEmail(email, callback) 
{
    var atpos = email.indexOf("@");
    var dotpos = email.lastIndexOf(".");
    var isEmail = 1;
    var param = " is a valid email";
    if(atpos < 1 || dotpos < atpos + 2 || dotpos + 2 >= email.length)
    {
        isEmail = 0;
        param = " is not a valid email";
    } 
    callback(isEmail, param);
}

//
//function sqlParam(param)
//{
//    var values = "";
//    for(var i = 0; i < param.length; i++) {
//        values += '"' + param[i] + '", ';
//    }
//    return values.substring(0, values.lastIndexOf(","));
//    
//}

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

//Check if the input is null
function is_null(status)
{
    return (status == "null" || status == null);
}

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

/* Finaly form verification for user's sign up page */
function verifySubmittedForm(username, email, password, callback) {
    verifyUser(username, function(isUser, user_status_message){
        if(isUser) {
            verifyEmail(email, function(isEmail, email_status_message){
                if(isEmail){
                    if(verifyPassword(password)[0].pass) {
                        callback(true);
                    } else {
                        callback(false);
                    }
                } else {
                    callback(false);
                }
            });
        }
        else {
            callback(false);
        }
    });
}

