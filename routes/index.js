var express = require('express');
var router = express.Router();
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const passport = require('passport');
var multer  = require('multer');
var upload = multer();
var AWS = require('aws-sdk');
const s3 = new AWS.S3({
    accessKeyId: process.env.AWSAccessKeyId,
    secretAccessKey: process.env.AWSSecretKey
});
var moment = require('moment');
let mysql = require('mysql');

// Middlewares
// function isSelf(req, res, next) {
//     // do any checks you want to in here
//
//     // CHECK THE USER STORED IN SESSION FOR A CUSTOM VARIABLE
//     // you can do this however you want with whatever variables you set up
//     if (req.user.id.toString() === req.params.id){
//         return next();
//     }
//     // IF A USER ISN'T LOGGED IN, THEN REDIRECT THEM SOMEWHERE
//     res.render('404');
// }

function isAuthenticated(req, res, next) {
    // do any checks you want to in here

    // CHECK THE USER STORED IN SESSION FOR A CUSTOM VARIABLE
    // you can do this however you want with whatever variables you set up
    if (req.isAuthenticated())
        return next();
    // IF A USER ISN'T LOGGED IN, THEN REDIRECT THEM SOMEWHERE
    res.redirect('/login');
}

function isNotAuthenticated(req, res, next) {
    // do any checks you want to in here

    // CHECK THE USER STORED IN SESSION FOR A CUSTOM VARIABLE
    // you can do this however you want with whatever variables you set up
    if (!(req.isAuthenticated())){
        return next();
    }
    // IF A USER IS LOGGED IN, THEN REDIRECT THEM SOMEWHERE
    res.redirect('/403');
}

function isOwnResource(req, res, next) {
    let uri = req._parsedOriginalUrl.path;
    uri = uri.substring(1);
    uri = uri.substring(0, uri.lastIndexOf('/'));
    if (uri.includes('/')){
        uri = uri.substring(0, uri.lastIndexOf('/'));
    }
    uri = uri.substring(0, uri.length - 1);
    let table = uri;
    let resourceid = req.params.id;
    if (table === 'user') {
        if (req.user.id !== Number(resourceid)) {
            res.render('403');
        } else {
            next();
        }
    } else {
        var connection = mysql.createConnection({
            host     : process.env.DB_HOSTNAME,
            user     : process.env.DB_USERNAME,
            password : process.env.DB_PASSWORD,
            port     : process.env.DB_PORT,
            database : process.env.DB_NAME,
            multipleStatements: true
        });
        connection.query('SELECT userid FROM ' + table + ' WHERE id = ?', [resourceid], function (error, results, fields) {
            // error will be an Error if one occurred during the query
            // results will contain the results of the query
            // fields will contain information about the returned results fields (if any)
            if (error) {
                throw error;
            }
            if (req.user.id !== results[0].userid) {
                res.render('403');
            } else {
                next();
            }
        });
    }
}

function isResource(req, res, next) {
    let uri = req._parsedOriginalUrl.path;
    uri = uri.substring(1);
    uri = uri.substring(0, uri.lastIndexOf('/'));
    if (uri.includes('/')){
        uri = uri.substring(0, uri.lastIndexOf('/'));
    }
    if (uri.includes('?')){
        uri = uri.substring(0, uri.lastIndexOf('?'));
    }
    if (uri.includes('api/')){
        uri = uri.substring(4);
    }
    uri = uri.substring(0, uri.length - 1);
    let table = uri;
    let resourceid = req.params.id;
    var connection = mysql.createConnection({
        host     : process.env.DB_HOSTNAME,
        user     : process.env.DB_USERNAME,
        password : process.env.DB_PASSWORD,
        port     : process.env.DB_PORT,
        database : process.env.DB_NAME,
        multipleStatements: true
    });
    connection.query('SELECT id FROM ' + table + ' WHERE id = ?', [resourceid], function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        if (results.length === 0){
            res.render('404');
        }
        else {
            next();
        }
    });
}

/* GET home page. */
router.get('/', function(req, res, next) {
    if (!req.isAuthenticated()){
        res.render('home/index', {
            req: req,
            title: 'POST67.com',
            alert: req.flash('alert')
        });
    }
    connection.query('SELECT count(*) as status FROM topicfollowing WHERE following = ?', [req.user.id],
        function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        if (results[0].status === 0){
            res.render('home/index', {
                req: req,
                title: 'POST67.com',
                alert: req.flash('alert')
            });
        }
        connection.query('SELECT t.id, t.name, t.imageurl FROM topicfollowing as tf inner join topic as t ' +
            'on tf.followed = t.id where tf.following = ? ORDER BY tf.datecreated DESC', [req.user.id],
            function (error, results, fields) {
                if (error) {
                    throw error;
                }
                console.log(results);
                res.render('home/indexfeed', {
                    req: req,
                    results: results,
                    title: 'POST67.com',
                    alert: req.flash('alert')
                });
            }
        );

    });
});

/// USERS ROUTES ///
// GET request for creating a User. NOTE This must come before routes that display User (uses id).
router.get('/users/new', isNotAuthenticated, function(req, res){
    res.render('users/new', {
        req: req,
        title: 'Sign up',
        errors: req.flash('errors'),
        inputs: req.flash('inputs')
    });
});

// POST request for creating User.
router.post('/users', isNotAuthenticated, [
        // validation
        body('email', 'Empty email.').not().isEmpty(),
        body('password', 'Empty password.').not().isEmpty(),
        body('username', 'Empty username.').not().isEmpty(),
        body('email', 'Email must be between 5-200 characters.').isLength({min:5, max:200}),
        body('password', 'Password must be between 5-60 characters.').isLength({min:5, max:60}),
        body('username', 'Username must be between 5-200 characters.').isLength({min:5, max:200}),
        body('email', 'Invalid email.').isEmail(),
        body('password', 'Password must contain one lowercase character, one uppercase character, a number, and ' +
            'a special character.').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, "i")
    ], (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            // Error messages can be returned in an array using `errors.array()`.
            req.flash('errors', errors.array());
            req.flash('inputs', {email: req.body.email, username: req.body.username});
            res.redirect('/users/new');
        }
        else {
            sanitizeBody('email').trim().escape();
            sanitizeBody('password').trim().escape();
            sanitizeBody('username').trim().escape();
            const email = req.body.email;
            const password = req.body.password;
            const username = req.body.username;
            bcrypt.hash(password, saltRounds, function(err, hash) {
                // Store hash in your password DB.
                if (err) {
                    throw error;
                }
                connection.query('INSERT INTO user (email, username, password) VALUES (?, ?, ?)',
                    [email, username, hash], function (error, results, fields) {
                    // error will be an Error if one occurred during the query
                    // results will contain the results of the query
                    // fields will contain information about the returned results fields (if any)
                    if (error) {
                        throw error;
                    }
                    req.flash('alert', 'You have successfully registered.');
                    res.redirect('/login');
                });
            });
        }
    }
);

// GET request for one User.
router.get('/users/:id', isResource, function(req, res){
    connection.query('SELECT id, username, description, imageurl, datecreated FROM user WHERE id = ?; SELECT id, ' +
        'name, description, imageurl, datecreated FROM post WHERE userid = ? ORDER BY datecreated DESC LIMIT 10; SELECT count(*) ' +
        'as postscount FROM post WHERE userid = ?;SELECT count(*) as followingcount FROM topicfollowing WHERE following = ?;' +
        'SELECT count(*) as commentscount FROM comment WHERE userid = ?;SELECT count(*) as upvotescount FROM upvote WHERE upvote = ?;',
        [req.params.id, req.params.id, req.params.id, req.params.id, req.params.id, req.params.id], function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        res.render('users/show', {
            req: req,
            results: results,
            title: 'Profile',
            moment: moment,
            alert: req.flash('alert')
        });
    });
});

/// GET request for user following sorted by created date in descending order limit by 10
router.get('/users/:id/following', isResource, function(req, res){
    connection.query('SELECT id, username, description, imageurl, datecreated FROM user WHERE id = ?; SELECT t.id, ' +
        't.name, t.imageurl from topicfollowing as tf inner join topic as t on tf.followed = t.id where tf.following ' +
        '= ? ORDER BY tf.datecreated DESC LIMIT 10; SELECT count(*) as postscount FROM post WHERE userid = ?;SELECT count(*) ' +
        'as followingcount FROM topicfollowing WHERE following = ?; SELECT count(*) as commentscount FROM comment WHERE userid = ?;' +
        'SELECT count(*) as upvotescount FROM upvote WHERE upvote = ?;',
        [req.params.id, req.params.id, req.params.id, req.params.id, req.params.id, req.params.id], function (error, results, fields) {
            // error will be an Error if one occurred during the query
            // results will contain the results of the query
            // fields will contain information about the returned results fields (if any)
            if (error) {
                throw error;
            }
            res.render('users/following', {
                req: req,
                results: results,
                title: 'User following',
                moment: moment,
                alert: req.flash('alert')
            });
        });
});

router.get('/api/users/:id/following', isResource, function(req, res){
    connection.query('SELECT t.id, t.name, t.imageurl from topicfollowing as tf inner join topic as t on tf.followed = t.id where tf.following = ? ORDER BY tf.datecreated DESC LIMIT 10 OFFSET ?',
        [req.params.id, Number(req.query.skip)], function (error, results, fields) {
            // error will be an Error if one occurred during the query
            // results will contain the results of the query
            // fields will contain information about the returned results fields (if any)
            if (error) {
                throw error;
            }
            res.status(200).json({ results: results });
        });
});

/// GET request for user comments sorted by created date in descending order limit by 10
router.get('/users/:id/comments', isResource, function(req, res){
    connection.query('SELECT id, username, description, imageurl, datecreated FROM user WHERE id = ?;SELECT id, ' +
        'description, datecreated FROM comment WHERE userid = ? ORDER BY datecreated DESC LIMIT 10; SELECT count(*) as postscount FROM post WHERE userid = ?; SELECT' +
        ' count(*) as followingcount FROM topicfollowing WHERE following = ?;SELECT count(*) as commentscount FROM comment WHERE userid = ?;' +
        'SELECT count(*) as upvotescount FROM upvote WHERE upvote = ?;',
        [req.params.id, req.params.id, req.params.id, req.params.id, req.params.id, req.params.id], function (error, results, fields) {
            // error will be an Error if one occurred during the query
            // results will contain the results of the query
            // fields will contain information about the returned results fields (if any)
            if (error) {
                throw error;
            }
            res.render('users/comments', {
                req: req,
                results: results,
                title: 'User comments',
                moment: moment,
                alert: req.flash('alert')
            });
        });
});

/// GET request for user upvotes sorted by created date in descending order limit by 10
router.get('/users/:id/upvotes', isResource, function(req, res){
    connection.query('SELECT id, username, description, imageurl, datecreated FROM user WHERE id = ?;SELECT p.id, p.name,' +
        'p.description, p.imageurl, p.datecreated from upvote as up inner join post as p on up.upvoted = p.id where up.upvote = ? ORDER BY up.datecreated DESC LIMIT 10; SELECT count(*) as postscount FROM post WHERE userid = ?; SELECT' +
        ' count(*) as followingcount FROM topicfollowing WHERE following = ?;SELECT count(*) as commentscount FROM comment WHERE userid = ?;' +
        'SELECT count(*) as upvotescount FROM upvote WHERE upvote = ?;',
        [req.params.id, req.params.id, req.params.id, req.params.id, req.params.id, req.params.id], function (error, results, fields) {
            // error will be an Error if one occurred during the query
            // results will contain the results of the query
            // fields will contain information about the returned results fields (if any)
            if (error) {
                throw error;
            }
            res.render('users/upvotes', {
                req: req,
                results: results,
                title: 'User upvotes',
                moment: moment,
                alert: req.flash('alert')
            });
        });
});

router.get('/api/users/:id/upvotes', isResource, function(req, res){
    connection.query('SELECT p.id, p.name,p.description, p.imageurl, p.datecreated from upvote as up inner join post as p on up.upvoted = p.id where up.upvote = ? ORDER BY up.datecreated DESC LIMIT 10'
        ,[req.params.id], function (error, results, fields) {
            // error will be an Error if one occurred during the query
            // results will contain the results of the query
            // fields will contain information about the returned results fields (if any)
            if (error) {
                throw error;
            }
        res.status(200).json({ results: results });
        });
});



// GET request to update User.
router.get('/users/:id/edit', isResource, isAuthenticated, isOwnResource, function(req, res){
    connection.query('SELECT id, email, username, description, imageurl FROM user WHERE id = ?', [req.params.id],
        function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        res.render('users/edit', {
            req: req,
            results: results,
            title: 'Edit profile',
            errors: req.flash('errors'),
            inputs: req.flash('inputs')
        });
    });
});

// PUT request to update User.
router.put('/users/:id', isResource, isAuthenticated, isOwnResource, upload.single('file'), [
    body('email', 'Empty email').not().isEmpty(),
    body('username', 'Empty username').not().isEmpty(),
    body('description', 'Empty password').not().isEmpty(),
    body('email', 'Email must be between 5-200 characters.').isLength({min:5, max:200}),
    body('username', 'Username must be between 5-200 characters.').isLength({min:5, max:200}),
    body('description', 'Description must be between 5-500 characters.').isLength({min:5, max:500}),
    body('email', 'Invalid email').isEmail()
], (req, res) => {
    // check if inputs are valid
    // if yes then upload picture to S3, get new imageurl, check existing imageurl and if it is not
    // default picture delete it using link, save imageurl and other fields into DB and if successful
    // return to user home page
    const errors = validationResult(req);
    let errorsarray = errors.array();
    // file is not empty
    // file size limit (max 30mb)
    // file type is image
    if (req.file.size === 0){
        errorsarray.push({msg: "File cannot be empty."});
    }
    if (req.file.mimetype.slice(0, 5) !== 'image'){
        errorsarray.push({msg: "File type needs to be image."});
    }
    if (req.file.size > 30000000){
        errorsarray.push({msg: "File cannot exceed 30MB."});
    }
    if (errorsarray.length !== 0) {
        // There are errors. Render form again with sanitized values/errors messages.
        // Error messages can be returned in an array using `errors.array()`.
        req.flash('errors', errorsarray);
        req.flash('inputs', {email: req.body.email, username: req.body.username, description: req.body.description});
        res.redirect(req._parsedOriginalUrl.pathname + '/edit');
    }
    else {
        sanitizeBody('email').trim().escape();
        sanitizeBody('username').trim().escape();
        sanitizeBody('description').trim().escape();
        const email = req.body.email;
        const username = req.body.username;
        const description = req.body.description;
        // upload image to AWS, get imageurl, check existing imageurl and if not pointing to default profile picture,
        // delete associated image from bucket, update row from DB with email, username, description, imageurl
        // console.log(req.file);
        const uploadParams = {
            Bucket: 'postappbucket', // pass your bucket name
            Key: 'profiles/' + req.file.originalname, // file will be saved as testBucket/contacts.csv
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        };
        s3.upload (uploadParams, function (err, data) {
            if (err) {
                console.log("Error", err);
            } if (data) {
                if (req.user.imageurl !== 'https://s3.amazonaws.com/postappbucket/profiles/blank-profile-picture-973460_640.png'){
                    const uploadParams2 = {
                        Bucket: 'postappbucket', // pass your bucket name
                        Key: 'profiles/' + req.body.imageurl.substring(req.body.imageurl.lastIndexOf('/') + 1) // file will be saved as testBucket/contacts.csv
                    };
                    s3.deleteObject(uploadParams2, function(err, data) {
                        if (err) console.log(err, err.stack);  // error
                        else     console.log();                 // deleted
                    });
                }
                connection.query('UPDATE user SET email = ?, username = ?, description = ?, imageurl = ? WHERE id = ?', [email, username, description, data.Location, req.params.id], function (error, results, fields) {
                    // error will be an Error if one occurred during the query
                    // results will contain the results of the query
                    // fields will contain information about the returned results fields (if any)
                    if (error) {
                        throw error;
                    }
                    req.flash('alert', 'Profile edited.');
                    res.redirect(req._parsedOriginalUrl.pathname);
                });
            }
        });
    }
});

// DELETE request to delete User.
router.delete('/users/:id', isResource, isAuthenticated, isOwnResource, function(req, res){
    connection.query('DELETE FROM user WHERE id = ?', [req.params.id], function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        req.flash('alert', 'Profile deleted.');
        req.logout();
        res.redirect('/');
    });
});

/// POST ROUTES ///
// GET request for creating a Post. NOTE This must come before routes that display Post (uses id).
router.get('/posts/new', isAuthenticated, function(req, res){
    res.render('posts/new', {
        req: req,
        title: 'Post',
        errors: req.flash('errors'),
        inputs: req.flash('inputs')
    });
});

// POST request for creating Post.
router.post('/posts', isAuthenticated, upload.single('file'), [
        body('name', 'Empty name.').not().isEmpty(),
        body('description', 'Empty description.').not().isEmpty(),
        body('topic', 'Empty topic').not().isEmpty(),
        body('name', 'Name must be between 5-200 characters.').isLength({min:5, max:200}),
        body('description', 'Description must be between 5-300 characters.').isLength({min:5, max:300})
    ], (req, res) => {
        const errors = validationResult(req);
        let errorsarray = errors.array();
        // file is not empty
        // file size limit (max 30mb)
        // file type is image
        if (req.file.size === 0){
            errorsarray.push({msg: "File cannot be empty."});
        }
        if (req.file.mimetype.slice(0, 5) !== 'image'){
            errorsarray.push({msg: "File type needs to be image."});
        }
        if (req.file.size > 30000000){
            errorsarray.push({msg: "File cannot exceed 30MB."});
        }
        if (errorsarray.length !== 0) {
            // There are errors. Render form again with sanitized values/errors messages.
            // Error messages can be returned in an array using `errors.array()`.
            req.flash('errors', errorsarray);
            req.flash('inputs', {name: req.body.name, description: req.body.description, topic: req.body.topic});
            res.redirect('/posts/new');
        }
        else {
            sanitizeBody('name').trim().escape();
            sanitizeBody('description').trim().escape();
            sanitizeBody('topic').trim().escape();
            const name = req.body.name;
            const description = req.body.description;
            const topic = req.body.topic;
            // upload image to AWS, get imageurl, insert row into DB with title, description, topic, imageurl, currentuserid, and
            // meta data fields for image (size, type, etc...)
            // console.log(req.file);
            const uploadParams = {
                Bucket: 'postappbucket', // pass your bucket name
                Key: 'images/' + req.file.originalname, // file will be saved as testBucket/contacts.csv
                Body: req.file.buffer,
                ContentType: req.file.mimetype
            };
            s3.upload (uploadParams, function (err, data) {
                if (err) {
                    console.log("Error", err);
                } if (data) {
                    connection.query('INSERT INTO post (name, description, imageurl, userid, topicid) VALUES ' +
                        '(?, ?, ?, ?, ?)', [name, description, data.Location, req.user.id, topic], function (error, results, fields) {
                        // error will be an Error if one occurred during the query
                        // results will contain the results of the query
                        // fields will contain information about the returned results fields (if any)
                        if (error) {
                            throw error;
                        }
                        req.flash('alert', 'Post created.');
                        res.redirect(`/users/${req.user.id}`);
                    });
                    // console.log("Upload Success", data.Location);
                }
            });
        }
    }
);

// GET request for one Post.
router.get('/posts/:id', isResource, function(req, res){
    connection.query('select p.id, p.name, p.description, p.imageurl, p.datecreated, p.userid, p.topicid, ' +
        'u.username, t.name as topicname from post as p inner join user as u on p.userid = u.id inner join topic as t on p.topicid = t.id where p.id = ?' +
        '; SELECT c.id, c.description, c.datecreated, c.userid, u.username FROM comment as c inner join user as u on ' +
        'c.userid = u.id WHERE c.postid = ? ORDER BY c.datecreated DESC LIMIT 10;SELECT count(*) as commentscount FROM comment WHERE postid = ?;SELECT count(*) as upvotescount FROM upvote WHERE upvoted = ?;', [req.params.id, req.params.id, req.params.id, req.params.id], function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        // console.log(results);
        // res.render('posts/show', {
        //     req: req,
        //     results: results,
        //     title: 'Post',
        //     moment: moment,
        //     alert: req.flash('alert')
        // });
        if (req.isAuthenticated()) {
            connection.query('SELECT count(*) as status FROM upvote WHERE upvote = ? and upvoted = ?;', [req.user.id, req.params.id],
                function (error, result, fields) {
                    if (error) {
                        throw error;
                    }
                    res.render('posts/show', {
                        req: req,
                        results: results,
                        title: 'Post',
                        result: result,
                        moment: moment,
                        alert: req.flash('alert')
                    });
                });
        } else {
            res.render('posts/show', {
                req: req,
                results: results,
                title: 'Post',
                moment: moment,
                alert: req.flash('alert')
            });
        }
    });
});

router.get('/api/posts/:id/comments', isResource, function(req, res){
    connection.query('SELECT c.id, c.description, c.datecreated, c.userid, u.username FROM comment as c inner join user as u on c.userid = u.id WHERE c.postid = ? ORDER BY c.datecreated DESC LIMIT 10 OFFSET ?', [req.params.id, Number(req.query.skip)], function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        res.status(200).json({ results: results });
    });
});

// GET request to update Post.
router.get('/posts/:id/edit', isResource, isAuthenticated, isOwnResource, function(req, res){
    connection.query('SELECT id, name, description, imageurl, topicid FROM post WHERE id = ?', [req.params.id],
        function (error, results, fields) {
            // error will be an Error if one occurred during the query
            // results will contain the results of the query
            // fields will contain information about the returned results fields (if any)
            if (error) {
                throw error;
            }
            res.render('posts/edit', {
                req: req,
                results: results,
                title: 'Edit post',
                errors: req.flash('errors'),
                inputs: req.flash('inputs')
            });
        });
});

// PUT request to update Post.
router.put('/posts/:id', isResource, isAuthenticated, isOwnResource, upload.single('file'), [
    body('name', 'Empty name.').not().isEmpty(),
    body('description', 'Empty description.').not().isEmpty(),
    body('topic', 'Empty topic').not().isEmpty(),
    body('name', 'Name must be between 5-200 characters.').isLength({min:5, max:200}),
    body('description', 'Description must be between 5-300 characters.').isLength({min:5, max:300})
], (req, res) => {
    // check if inputs are valid
    // if yes then upload picture to S3, get new imageurl, check existing imageurl and if it is not
    // default picture delete it using link, save imageurl and other fields into DB and if successful
    // return to user home page
    const errors = validationResult(req);
    let errorsarray = errors.array();
    // file is not empty
    // file size limit (max 30mb)
    // file type is image
    if (req.file.size === 0){
        errorsarray.push({msg: "File cannot be empty."});
    }
    if (req.file.mimetype.slice(0, 5) !== 'image'){
        errorsarray.push({msg: "File type needs to be image."});
    }
    if (req.file.size > 30000000){
        errorsarray.push({msg: "File cannot exceed 30MB."});
    }
    if (errorsarray.length !== 0) {
        // There are errors. Render form again with sanitized values/errors messages.
        // Error messages can be returned in an array using `errors.array()`.
        req.flash('errors', errorsarray);
        req.flash('inputs', {name: req.body.name, description: req.body.description, topicid: req.body.topic});
        res.redirect(req._parsedOriginalUrl.pathname + '/edit');
    }
    else {
        sanitizeBody('name').trim().escape();
        sanitizeBody('description').trim().escape();
        sanitizeBody('topic').trim().escape();
        const name = req.body.name;
        const description = req.body.description;
        const topic = req.body.topic;
        // upload image to AWS, get imageurl, check existing imageurl and if not pointing to default profile picture,
        // delete associated image from bucket, update row from DB with email, username, description, imageurl
        // console.log(req.file);
        const uploadParams = {
            Bucket: 'postappbucket', // pass your bucket name
            Key: 'images/' + req.file.originalname, // file will be saved as testBucket/contacts.csv
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        };
        s3.upload (uploadParams, function (err, data) {
            if (err) {
                console.log("Error", err);
            } if (data) {
                    const uploadParams2 = {
                        Bucket: 'postappbucket', // pass your bucket name
                        Key: 'images/' + req.body.imageurl.substring(req.body.imageurl.lastIndexOf('/') + 1) // file will be saved as testBucket/contacts.csv
                    };
                    s3.deleteObject(uploadParams2, function(err, data) {
                        if (err) console.log(err, err.stack);  // error
                        else     console.log();                 // deleted
                    });

                connection.query('UPDATE post SET name = ?, description = ?, imageurl = ?, topicid = ? WHERE id = ?', [name, description, data.Location, topic, req.params.id], function (error, results, fields) {
                    // error will be an Error if one occurred during the query
                    // results will contain the results of the query
                    // fields will contain information about the returned results fields (if any)
                    if (error) {
                        throw error;
                    }
                    req.flash('alert', 'Post edited.');
                    res.redirect(req._parsedOriginalUrl.pathname);
                });
            }
        });
    }
});

// DELETE request to delete Post.
router.delete('/posts/:id', isResource, isAuthenticated, isOwnResource, function(req, res){
    connection.query('DELETE FROM post WHERE id = ?', [req.params.id], function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        req.flash('alert', 'Post deleted.');
        res.redirect(`/users/${req.user.id}`);
    });
});

/// COMMENT ROUTES ///
// POST request for creating COMMENT.
router.post('/comments', isAuthenticated, [
            body('description', 'Empty description.').not().isEmpty(),
            body('description', 'Description must be between 5-300 characters.').isLength({min:5, max:300})
        ],
    (req, res) => {
        const errors = validationResult(req);
        let errorsarray = errors.array();
        if (errorsarray.length !== 0) {
            // There are errors. Render form again with sanitized values/errors messages.
            // Error messages can be returned in an array using `errors.array()`.
            res.status(400).json({ status: false, errors: errorsarray });
        }
        else {
            sanitizeBody('description').trim().escape();
            const description = req.body.description;
            connection.query('INSERT INTO comment (description, userid, postid) VALUES ' +
                        '(?, ?, ?)', [description, req.user.id, req.body.postid], function (error, results, fields) {
                        // error will be an Error if one occurred during the query
                        // results will contain the results of the query
                        // fields will contain information about the returned results fields (if any)
                        if (error) {
                            throw error;
                        }
                        connection.query('SELECT c.id, c.description, c.datecreated, c.userid, u.username FROM comment as c inner join user as u on c.userid = u.id WHERE c.id = ?', [results.insertId],
                            function (error2, results2, fields2){
                                if (error) {
                                    throw error;
                                }
                                res.status(200).json({ status: true, comment: results2 });
                            });

                    });
                    // console.log("Upload Success", data.Location);
        }
    }
);

// GET request for one Comment.
router.get('/comments/:id', isResource, function(req, res){
    connection.query('SELECT c.id, c.description, c.datecreated, c.userid, u.username FROM comment as c inner join user as u on c.userid = u.id WHERE c.id = ?', [req.params.id], function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        console.log(results);
        res.render('comments/show', {
            req: req,
            results: results,
            title: 'Comment',
            moment: moment,
            alert: req.flash('alert')
        });
    });
});

// DELETE request to delete Comment.
router.delete('/comments/:id', isResource, isAuthenticated, isOwnResource, function(req, res){
    connection.query('DELETE FROM comment WHERE id = ?', [req.params.id], function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        req.flash('alert', 'Comment deleted.');
        res.redirect(`/users/${req.user.id}`);
    });
});

/// TOPIC ROUTES ///
// GET request for list of all Topic items.
router.get('/topics', function(req, res){
    connection.query('SELECT * FROM `topic`', function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        res.render('topics/index', {
            req: req,
            results: results,
            title: 'Explore',
            alert: req.flash('alert')
        });
    });
});

// get topic information, get 10 images of the topic, if current user is logged in, check if he has
// followed topic or not if yes pass unfollow to button value else pass follow to button value
router.get('/topics/:id', isResource, function(req, res){
    connection.query('SELECT id, name, description, imageurl, datecreated FROM `topic` WHERE id = ?; SELECT id, ' +
        'name, description, imageurl, datecreated FROM post WHERE topicid = ? ORDER BY datecreated DESC LIMIT 10; SELECT count(*) as postscount ' +
        'FROM post WHERE topicid = ?;SELECT count(*) as followerscount FROM topicfollowing WHERE followed = ?',
        [req.params.id, req.params.id, req.params.id, req.params.id],
        function (error, results, fields) {
            // error will be an Error if one occurred during the query
            // results will contain the results of the query
            // fields will contain information about the returned results fields (if any)
            if (error) {
                throw error;
            }
            if (req.isAuthenticated()) {
                connection.query('SELECT count(*) as status FROM topicfollowing WHERE following = ? and followed = ?;', [req.user.id, req.params.id],
                    function (error, result, fields) {
                        if (error) {
                            throw error;
                        }
                        res.render('topics/show', {
                            req: req,
                            results: results,
                            title: 'Topic',
                            result: result,
                            moment: moment,
                            alert: req.flash('alert')
                        });
                    });
            } else {
                res.render('topics/show', {
                    req: req,
                    results: results,
                    title: 'Topic',
                    moment: moment,
                    alert: req.flash('alert')
                });
            }
        });
});

/// GET request for topic followers sorted by created date in descending order limit by 10
router.get('/topics/:id/followers', isResource, function(req, res){
    connection.query('SELECT id, name, description, imageurl FROM `topic` WHERE id = ?; SELECT u.id, u.username, ' +
        'u.imageurl from topicfollowing as tf inner join user as u on tf.following = u.id where tf.followed = ? ' +
        'ORDER BY tf.datecreated DESC LIMIT 10; SELECT count(*) as postscount FROM post WHERE topicid = ?;' +
        'SELECT count(*) as followerscount FROM topicfollowing WHERE followed = ?',
        [req.params.id, req.params.id, req.params.id, req.params.id], function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        res.render('topics/followers', {
            req: req,
            results: results,
            title: 'Topic followers',
            alert: req.flash('alert')
        });
    });
});

router.get('/api/topics/:id/followers', isResource, function(req, res){
    connection.query('SELECT u.id, u.username, u.imageurl from topicfollowing as tf inner join user as u on tf.following = u.id where tf.followed = ? ORDER BY tf.datecreated DESC LIMIT 10 OFFSET ?', [req.params.id, Number(req.query.skip)], function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        res.status(200).json({ results: results });
    });
});

/// TOPICFOLLOWING ROUTES ///
// POST request for creating Topicfollowing.
router.post('/topicfollowings', isAuthenticated, function(req, res) {
    connection.query('INSERT INTO topicfollowing (following, followed) VALUES (?, ?)', [req.user.id, req.body.topicid], function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        // console.log(results);
        // res.json({tfid: results.insertId});
        res.json({status: 'done'});
    });
});

router.delete('/topicfollowings', isAuthenticated, function(req, res) {
    connection.query('DELETE FROM topicfollowing WHERE following = ? and followed = ?', [req.user.id, req.body.topicid], function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        res.json({status: 'done'});
    });
});

/// UPVOTE ROUTES ///
// POST request for creating Upvote.
router.post('/upvotes', isAuthenticated, function(req, res) {
    connection.query('INSERT INTO upvote (upvote, upvoted) VALUES (?, ?)', [req.user.id, req.body.postid], function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        // console.log(results);
        // res.json({tfid: results.insertId});
        res.status(200).json({status: 'done'});
    });
});

router.delete('/upvotes', isAuthenticated, function(req, res) {
    connection.query('DELETE FROM upvote WHERE upvote = ? and upvoted = ?', [req.user.id, req.body.postid], function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        res.status(200).json({status: 'done'});
    });
});

/// LOGIN ROUTES ///
router.get('/login', isNotAuthenticated, function(req, res) {
    res.render('login', {
        req: req,
        title: 'Log in',
        errors: req.flash('errors'),
        input: req.flash('input'),
        alert: req.flash('alert')
    });
});

router.post('/login', isNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
})
);

router.get('/logout', isAuthenticated, function(req, res){
    req.logout();
    res.redirect('/login');
});

/// ERROR ROUTES ///
router.get('/403', function(req, res){
    res.render('403');
});

router.get('/404', function(req, res){
    res.render('404');
});

module.exports = router;
