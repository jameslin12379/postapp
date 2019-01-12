require("dotenv").config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let session = require('express-session')
let bodyParser = require('body-parser');
let mysql = require('mysql');
let passport = require('passport')
let LocalStrategy = require('passport-local').Strategy;
let flash = require('connect-flash');
let methodOverride = require("method-override");
const bcrypt = require('bcryptjs');
const saltRounds = 10;
var indexRouter = require('./routes/index');
var app = express();

var connection = mysql.createConnection({
    host     : process.env.DB_HOSTNAME,
    user     : process.env.DB_USERNAME,
    password : process.env.DB_PASSWORD,
    port     : process.env.DB_PORT,
    database : process.env.DB_NAME,
    multipleStatements: true
});
connection.connect(function(err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('connected as id ' + connection.threadId);
});
global.connection = connection;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(express.static('public'))
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    // function(username, password, done) {
    //     // User.findOne({ username: username }, function (err, user) {
    //     //     if (err) { return done(err); }
    //     //     if (!user) {
    //     //         return done(null, false, { message: 'Incorrect email.' });
    //     //     }
    //     //     if (!user.validPassword(password)) {
    //     //         return done(null, false, { message: 'Incorrect password.' });
    //     //     }
    //     //     return done(null, user);
    //     // });
    // }
    function(req, email, password, done) { // callback with email and password from our form

        connection.query("SELECT * FROM `user` WHERE `email` = '" + email + "'",function(err,rows){
            if (err)
                return done(err);
            if (!rows.length) {
                return done(null, false, req.flash('errors', 'No user found.'), req.flash('input', email)); // req.flash is the way to set flashdata using connect-flash
            }

            // if the user is found but the password is wrong
            const hash = rows[0].password.toString();
            console.log(hash);
            bcrypt.compare(password, hash, function(err, response) {
                if (response === true) {
                    return done(null, {id: rows[0].id, username: rows[0].username});
                }
                return done(null, false, req.flash('errors', 'Oops! Wrong password.'), req.flash('input', email));
            });
            // if (!( rows[0].password === password))
            //     return done(null, false, req.flash('errors', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

            // all is well, return successful user

            // return done(null, rows[0]);

        });}
));
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
    connection.query("select * from user where id = "+id,function(err,rows){
        done(err, rows[0]);
    });
});

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    // res.redirect('/404');
    res.render('404');
});

module.exports = app;

