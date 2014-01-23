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
var validator = require('validator');
var fs = require('fs');
var upload = require('jquery-file-upload-middleware');

//swig.setDefaults({ loader: swig.loaders.fs(__dirname + "/views/templates/")});

upload.configure({
    uploadDir: __dirname + '/public/img',
    uploadUrl: '/img',
    imageVersions: {
        thumbnail: {
            width: 80,
            height: 80
        }
    }
});

app.use('upload', upload.fileHandler());

/* Constant values */
var password_verification_text = ["Between 6 to 20 characters", "Contains 1 upper case letter", "Contains 1 lower case letter", "Contains 1 numeric character"];
var upperCase = new RegExp('[A-Z]');
var lowerCase = new RegExp('[a-z]');
var numbers = new RegExp('[0-9]');

// Domain name
var domain_root = "http://localhost:3000";

//Set up database
var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "pozzerteam2win",
    database: 'pozz_test'
});

//mailer sends out email from the app
mailer.extend(app, {
    from: 'no-repy@gmail.com',
    host: 'smtp.gmail.com',
    secureConnection: true,
    port: 465,
    transportMethod: 'SMTP',
    auth: {
        user: 'pozzerteam',
        pass: 'pozzerteam2win'
    }
})

/* Connect to the database with connection */
connection.connect(function (err) {
    if (err === "null") {
        console.log("Error connecting to database: " + err);
    } else {
        console.log("Successfully connected to database!");
    }
});

connection.query('select * from post', function (err, result) {
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
app.use(express.session({
    secret: "Pozz secret secret"
}));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cookieParser());
app.use(express.session({}));
app.use(express.bodyParser({
    keepExtensions: true,
    uploadDir: __dirname + '/public/img'
}));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

/*  Search page */
app.get('/search', function (req, res) {
    var postbox = swig.compileFile(__dirname + "/views/search/search-post-box.html");
//    var postboxjs = swig.compileFile(__dirname + "/views/fileupload.html");

//    console.log(post);
    if (req.session.sid) {
        res.render('search/search', {
            signedin: true,
            username: req.session.username,
            post_box: postbox
        });
        
    } else {
        res.render('search/search', {
            signedin: false,
            username: "",
            post_box: postbox
        });
    }
    //if first time visitor
});

/* Renders the index page template */
app.get('/', function (req, res) {
    res.render('index', {
        domainname: domain_root
    });

});
http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});



/* Email confirmation when user first sign up */
app.get('/email_confirmation', function (req, res) {
    var hashValue = req.query.eid;
    console.log(hashValue);
    //Check if the confirmation hash is verified
    connection.query('select confirmed from email_confirmation where eid="' + hashValue + '"', function (err, result) {
        //Confirm the hash value
        if (result[0]['confirmed'] == 0) {
            connection.query('update email_confirmation set confirmed=1 where eid="' + hashValue + '"', function (err, result) {
                if (is_null(err)) {
                    res.send("Email confirmed!");
                }
            });
        } else if (result[0]['confirmed'] == 1) {
            res.send("Your email hash already been confirmed!");
            //hash value has been previously confirmed
        } else {

            res.send("Your confirmation email is not quite right....?");
            //There is no such eid          
        }
        console.log("result:" + JSON.stringify(result));
    });
});

app.post('/signin', function (req, res) {
    var sql = 'SELECT * FROM USERS WHERE (username=? OR email=?) AND password=?';
    var inserts = [connection.escape(req.body.username), connection.escape(req.body.username), connection.escape(req.body.password)];
    sql = mysql.format(sql, inserts);

    var temp = connection.query(sql, function (err, result) {
        if (err) {
            console.log("Sign in error: " + err);
        } else {
            //User not found
            if (result.length == 0) {
                res.render('signinform', {
                    needfix: true,
                    message: "Either username or password is not correct"
                });
            } else {
                res.render("search");
            }
            //            res.render("search");
        }
    });
    console.log(temp.sql);
});

app.get('/signinform', function (req, res) {
    res.render('signinform');
});

/* For people  signing up for beta testing */
app.post('/betainvite', function (req, res) {

    var tbname = "beta_tester_contact";
    var isValidated = validator.isEmail(req.body.invitation_email) && validator.isAlpha(req.body.first_name);
    if (isValidated) {

        var sql = "SELECT * FROM ?? WHERE ?? = ?";
        var inserts = [tbname, 'email', connection.escape(req.body.invitation_email)];
        sql = mysql.format(sql, inserts);
        console.log(req.body.invitation_email);
        console.log(connection.escape(req.body.invitation_email));

        //Check if duplicate email has been entered
        var temp = connection.query(sql,
            function (err, result) {
                if (err) {
                    console.log("Beta Invite Error: " + err);
                } else {
                    //Email is unique
                    if (result.length == 0) {
                        sql = "INSERT INTO ?? (??,??,??) values(?,?,?)";
                        inserts = [tbname, 'firstname', 'email', 'signupdate', connection.escape(req.body.first_name), connection.escape(req.body.invitation_email), getDate()];
                        sql = mysql.format(sql, inserts);

                        //insert unique email
                        connection.query(sql, function (err, result) {
                            if (err) {
                                console.log("Error:" + err);
                            } else {
                                res.send({
                                    verify: 1,
                                    message: "Thank you for signing up, you will hear back from us soon!"
                                });
                            }
                        });
                    } else {
                        res.send({
                            verify: 0,
                            message: "Thank you for signing up, your email is already in our system."
                        });
                    }

                }
            });
        console.log(temp.sql);
    }
});

app.get('/test', function(req, res) {
    res.render("test");
});

app.post('/uploadimg', function (req, res) {
    var filename = req.files.files[0].originalFilename;
    var path = req.files.files[0].path;
    console.log(req.files.files[0]);
    fs.readFile(path, function (err, data) {
        var newPath = __dirname + "/public/img/" + filename;
        fs.writeFile(newPath, data, function (err) {
            console.log("finished saving image");
            var response = {
                "files": {
                    "name:": filename,
                    "size": req.files.files[0].size,
                    "url": "http://localhost/img/" + filename
                }
            }
            res.send(response);
        });
    });
});

/* Handles the request when user submits a post */
/* Check for potential sql injection */
/* params: title, price, days, location, images  */
app.post('/createpost', function (req, res) {
    
    var id = req.body.id;
    var title = connection.escape(req.body.title);
    var price = connection.escape(req.body.price);
    var description = connection.escape(req.body.description);
    var days = connection.escape(req.body.days);
    var location = connection.escape(req.body.location);
    

});


//Create PID takes in two integer and create a string 
//concatenating two and returns the string representation
function createPID(int uid)
{
    var random = Math.random() * 1000;
    console.log("pid: " + random.toString() + uid.toString());
}

app.post('/login', function (req, res) {
    var user = req.body.username;
    var pass = req.body.password;
    var response = res.
    connection.query('select password from users where username="' + user + '"', function (err, result) {
        if (result[0]['password'] == pass) {

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
app.post('/signup', function (req, res) {
    var uid = createUID();
    var isVerified = false;
    verifySubmittedForm(req.body.username, req.body.email, req.body.password, function (isValid) {

        if (isValid) {
            var sql = "INSERT INTO USERS (??,??,??,??,??) VALUES (?,?,?,?,?)";
            var inserts = ["uid", "username", "password", "email", "signdate", createUID(), connection.escape(req.body.username), connection.escape(req.body.password), req.body.email, getDate()];
            sql = mysql.format(sql, inserts);

            //Add user to the database, send them an email confirmation link
            connection.query(sql,
                function (err, result) {
                    if (err) {
                        console.log("Sign up error:" + err);
                    } else {
                        var hashing = crypto.createHash('md5').update(req.body.username).digest('hex');
                        req.session.sid = hashing;
                        req.session.username = req.body.username;
                        console.log("Successfully added a new user");
                        res.cookie("sid", hashing);
                        res.cookie("username", req.body.username);

                        //Send confirmation email
                        sendConfirmationEmail(req.body.username, req.body.email, hashing, uid, res)
                        res.render("search", {
                            signedin: true,
                            username: req.session.username
                        });
                    }
                });

        } else {
            res.render("signupform", {
                needfix: true,
                username: req.body.username,
                email: req.body.email,
                error_message: "Either username, password or email is not valid, please check again!"
            });
        }
    });
});

function sendConfirmationEmail(username, email, hash, uid, res) {
    res.mailer.send("emailconf", {
        to: email,
        subject: "Please confirm your email",
        username: username,
        confirm_link: 'http://localhost:3000/email_confirmation?eid=' + hash
    }, function (err) {
        if (err) {
            console.log("There was an error sending the email");
            return;
        } else {
            var stm = {
                tbname: "email_confirmation",
                params: ["eid", "uid", "confirmed"],
                values: [hash, uid, 0]
            }
            var sql = "INSERT INTO email_confirmation (??,??,??) VALUES (?,?,?)";
            var inserts = ["eid", "uid", "confirmed", hash, uid, 0];
            sql = mysql.format(sql, inserts);
            connection.query(sql, function (err, result) {
                if (err) {
                    console.log("confirmation error: cannot insert confirmation detail into database");
                } else {
                    console.log("Inserted confirmation data into system");
                };
            });
            console.log("Confirmation email sent");
        }
    });
}

app.get('/todo', function (req, res) {
    res.render("todo");
})



/* Renders a sign up from template */
app.get('/signupform', function (req, res) {
    res.render("signupform");
});


/* Renders a profile page from template */
app.get('/profile', function (req, res) {
    res.render("profile");
});

/* A process that verifies user input and return appropriate response */
app.post('/verify', function (req, res) {
    var value = req.body.value;
    var data;
    switch (req.body.type) {
    case 'text':
        verifyUser(value, function (isData, message) {
            res.send({
                verify: isData,
                statusText: message
            });
        });
        break;
    case 'email':
        verifyEmail(value, function (isEmail, message) {
            res.send({
                verify: isEmail,
                statusText: message
            });
        });
        break;
    case 'password':
        data = verifyPassword(value)[0];
        res.send({
            verify: data.pass,
            statusText: data.log
        });
        break;
    default:
        break;
    }
});


/* A function that verify user password */
function verifyPassword(pass) {
    var isValidPassword = 1;

    //Check if password length is in the right range
    var isLength = ((pass.length >= 6 && pass.length <= 20) ? true : false);

    //An array that holds boolean value that indicate each form's  passing status
    var instruction_pass = [isLength, upperCase.test(pass), lowerCase.test(pass), numbers.test(pass)];

    //Construct instructions for password
    var param = "<ul>";
    for (var i = 0; i < instruction_pass.length; i++) {
        if (instruction_pass[i]) {
            param += "<strike><li>" + password_verification_text[i] + "</li></strike>";
        } else {
            isValidPassword = 0;
            param += "<li>" + password_verification_text[i] + "</li>";
        }
    }
    if (isValidPassword) {
        param = "You've got a strong password";
    }
    return [{
        pass: isValidPassword,
        log: param
    }];
}


/* A function that verify if user already exists in database */
function verifyUser(username, callback) {
    var isUser = 1;
    var param = "";
    if (username.length < 4 || username.length > 10) {
        isUser = 0;
        param = "Username should be between 4 to 10 characters long"
        callback(isUser, param);
    }
    connection.query('select * from users where username="' + username + '"', function (err, result) {
        if (result && result.length == 0) {
            callback(isUser, username + " is available");
        } else {
            isUser = 0;
            callback(isUser, username + " has been taken");
        }
    });
}


// A function that verifies email based on the existence of a dot and @ symbol
function verifyEmail(email, callback) {
    //    var atpos = email.indexOf("@");
    //    var dotpos = email.lastIndexOf(".");
    //    var isEmail = 1;
    var param = " is a valid email";
    if (validator.isEmail(email)) {
        param = " is not a valid email";
    }
    //    if (atpos < 1 || dotpos < atpos + 2 || dotpos + 2 >= email.length) {
    ////        isEmail = 0;
    //        param = " is not a valid email";
    //    }
    callback(validator.isEmail(email), param);
}

function getDate() {
    var now = new Date();
    return now.getFullYear().toString() + "-" + (now.getMonth() + 1).toString() + "-" + now.getDay().toString();
}


function createUID() {
    var now = new Date();
    var uid = now.getMonth().toString() + now.getDay().toString() + now.getFullYear().toString() + now.getHours().toString() + now.getMinutes().toString() + now.getSeconds().toString() + now.getMilliseconds().toString();
    uid = parseInt(uid) % 10000000;
    console.log(uid);
    return parseInt(uid);
}

//Check if the input is null
function is_null(status) {
    return (status === "null" || status === null);
}

/*  tbname:string
    params:array of strings
    values:array of strings
    format -> JSON
    Convert a JSON object into mysql statement
*/
function insertInto(myJSON) {
    var mysql_stm = "insert into " + myJSON.tbname + " (";
    for (var i = 0; i < myJSON.params.length; i++) {
        mysql_stm += myJSON.params[i] + ',';
    }
    mysql_stm = mysql_stm.substring(0, mysql_stm.length - 1) + ") values (";
    for (var i = 0; i < myJSON.values.length; i++) {
        mysql_stm += '"' + myJSON.values[i] + '",'
    }
    mysql_stm = mysql_stm.substring(0, mysql_stm.length - 1) + ")";
    return mysql_stm;
}

/* Finaly form verification for user's sign up page */
function verifySubmittedForm(username, email, password, callback) {
    verifyUser(username, function (isUser, user_status_message) {
        if (isUser) {
            verifyEmail(email, function (isEmail, email_status_message) {
                if (isEmail) {
                    if (verifyPassword(password)[0].pass) {
                        callback(true);
                    } else {
                        callback(false);
                    }
                } else {
                    callback(false);
                }
            });
        } else {
            callback(false);
        }
    });
}