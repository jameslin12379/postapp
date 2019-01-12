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
function isAuthenticated(req, res, next) {
    // do any checks you want to in here

    // CHECK THE USER STORED IN SESSION FOR A CUSTOM VARIABLE
    // you can do this however you want with whatever variables you set up
    if (req.isAuthenticated())
        return next();
    // IF A USER ISN'T LOGGED IN, THEN REDIRECT THEM SOMEWHERE
    res.redirect('/login');
}

function isSelf(req, res, next) {
    // do any checks you want to in here

    // CHECK THE USER STORED IN SESSION FOR A CUSTOM VARIABLE
    // you can do this however you want with whatever variables you set up
    if (req.user.id.toString() === req.params.id){
        return next();
    }
    // IF A USER ISN'T LOGGED IN, THEN REDIRECT THEM SOMEWHERE
    res.redirect('/403');
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

function resourceExists(req, res, next) {
    // let table = '';
    let query = '';
    let l = req._parsedOriginalUrl.path[1];
    switch (l) {
        case 'u':
            query = 'SELECT id FROM user';
            break;
        case 'i':
            query = 'SELECT id FROM post';
            break;
        case 't':
            query = 'SELECT id FROM topic';
            break;
    }
    var connection = mysql.createConnection({
        host     : process.env.DB_HOSTNAME,
        user     : process.env.DB_USERNAME,
        password : process.env.DB_PASSWORD,
        port     : process.env.DB_PORT,
        database : process.env.DB_NAME,
        multipleStatements: true
    });
    connection.query(query + ' WHERE id = ?', [Number(req.params.id)], function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        if (results.length === 0){
            res.redirect('/404');
        }
        return next();
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
        function (error, results, fields) {I
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
router.get('/users/:id', resourceExists, function(req, res){
    connection.query('SELECT id, username, description, imageurl, datecreated FROM user WHERE id = ?; SELECT id, ' +
        'name, description, imageurl, datecreated FROM post WHERE userid = ? ORDER BY datecreated DESC LIMIT 10; SELECT count(*) ' +
        'as postscount FROM post WHERE userid = ?;SELECT count(*) as followingcount FROM topicfollowing WHERE following = ?;' +
        'SELECT count(*) as commentscount FROM comment WHERE userid = ?;SELECT count(*) as likescount FROM upvote WHERE upvote = ?;',
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
router.get('/users/:id/following', resourceExists, function(req, res){
    connection.query('SELECT id, username, datecreated, description, imageurl FROM user WHERE id = ?;SELECT t.id, ' +
        't.name, t.imageurl from topicfollowing as tf inner join topic as t on tf.followed = t.id where tf.following ' +
        '= ? ORDER BY tf.datecreated DESC LIMIT 10; SELECT count(*) as postscount FROM post WHERE userid = ?;SELECT count(*) ' +
        'as followingcount FROM topicfollowing WHERE following = ?; SELECT count(*) as commentscount FROM comment WHERE userid = ?;' +
        'SELECT count(*) as likescount FROM upvote WHERE upvote = ?;',
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

/// GET request for user comments sorted by created date in descending order limit by 10
router.get('/users/:id/comments', resourceExists, function(req, res){
    connection.query('SELECT id, username, datecreated, description, imageurl FROM user WHERE id = ?;SELECT id, ' +
        'description, datecreated FROM comment WHERE userid = ? ORDER BY datecreated DESC LIMIT 10; SELECT count(*) as postscount FROM post WHERE userid = ?; SELECT' +
        ' count(*) as followingcount FROM topicfollowing WHERE following = ?;SELECT count(*) as commentscount FROM comment WHERE userid = ?;' +
        'SELECT count(*) as likescount FROM upvote WHERE upvote = ?;',
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



// GET request to update User.
router.get('/users/:id/edit', resourceExists, isAuthenticated, isSelf, function(req, res){
    connection.query('SELECT id, email, username, description FROM user WHERE id = ?', [req.params.id],
        function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        res.render('users/edit', {
            req: req,
            result: results[0],
            title: 'Edit profile',
            errors: req.flash('errors'),
            inputs: req.flash('inputs')
        });
    });
});

// PUT request to update User.
router.put('/users/:id', resourceExists, isAuthenticated, isSelf, upload.single('file'), [
    body('email', 'Empty email').not().isEmpty(),
    body('username', 'Empty username').not().isEmpty(),
    body('description', 'Empty password').not().isEmpty(),
    body('email', 'Email must be between 5-200 characters.').isLength({min:5, max:200}),
    body('username', 'Username must be between 5-200 characters.').isLength({min:5, max:200}),
    body('description', 'Username must be between 5-500 characters.').isLength({min:5, max:500}),
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
                        Key: 'profiles/' + req.user.imageurl.substring(req.user.imageurl.lastIndexOf('/') + 1) // file will be saved as testBucket/contacts.csv
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
router.delete('/users/:id', resourceExists, isAuthenticated, isSelf, function(req, res){
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

/// IMAGE ROUTES ///
// GET request for creating a Image. NOTE This must come before routes that display Image (uses id).
router.get('/images/new', isAuthenticated, function(req, res){
    res.render('images/new', {
        req: req,
        title: 'Upload',
        errors: req.flash('errors'),
        inputs: req.flash('inputs')
    });
});

// POST request for creating Image.
router.post('/images', isAuthenticated, upload.single('file'), [
        // validation
        body('topic', 'Empty topic').not().isEmpty(),
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
            req.flash('inputs', {topic: req.body.topic});
            res.redirect('/images/new');
        }
        else {
            // const redirect = req.query.redirect;
            // Data from form is valid.
            sanitizeBody('topic').trim().escape();
            const topic = req.body.topic;
            // upload image to AWS, get imageurl, insert row into DB with title, description, topic, imageurl, currentuserid, and
            // meta data fields for image (size, type, etc...)
            // console.log(req.file);
            const uploadParams = {
                Bucket: 'imageappbucket', // pass your bucket name
                Key: 'images/' + req.file.originalname, // file will be saved as testBucket/contacts.csv
                Body: req.file.buffer,
                ContentType: req.file.mimetype
            };
            s3.upload (uploadParams, function (err, data) {
                if (err) {
                    console.log("Error", err);
                } if (data) {
                    connection.query('INSERT INTO image (imageurl, userid, topicid, originalname, ' +
                        'encoding, mimetype, size) VALUES (?, ?, ?, ?, ?, ?, ?)', [data.Location,
                    req.user.id, topic, req.file.originalname, req.file.encoding, req.file.mimetype, req.file.size], function (error, results, fields) {
                        // error will be an Error if one occurred during the query
                        // results will contain the results of the query
                        // fields will contain information about the returned results fields (if any)
                        if (error) {
                            throw error;
                        }
                        req.flash('alert', 'Photo uploaded.');
                        res.redirect(`/users/${req.user.id}`);
                    });
                    // console.log("Upload Success", data.Location);
                }
            });
        }
    }
);

// GET request for one Image.
router.get('/images/:id', resourceExists, function(req, res){
    connection.query('select i.id, i.imageurl, i.datecreated, i.userid, i.topicid, u.username, t.name from image as i inner join user as u on i.userid = u.id inner join topic as t on i.topicid = t.id where i.id = ?', [req.params.id], function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        res.render('images/show', {
            req: req,
            result: results[0],
            title: 'Photo',
            moment: moment,
            alert: req.flash('alert')
        });
    });
});

// DELETE request to delete Image.
router.delete('/images/:id', resourceExists, isAuthenticated, function(req, res){
    connection.query('SELECT userid FROM image WHERE id = ?', [req.params.id], function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if (error) {
            throw error;
        }
        const userid = results[0].userid;
        if (req.user.id !== userid) {
            res.redirect('/403');
        }
        connection.query('DELETE FROM image WHERE id = ?', [req.params.id], function (error, results, fields) {
            // error will be an Error if one occurred during the query
            // results will contain the results of the query
            // fields will contain information about the returned results fields (if any)
            if (error) {
                throw error;
            }
            req.flash('alert', 'Photo deleted.');
            res.redirect(`/users/${req.user.id}`);
        });
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
        console.log(results);
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
router.get('/topics/:id', resourceExists, function(req, res){
    connection.query('SELECT id, name, description, datecreated, imageurl FROM `topic` WHERE id = ?; SELECT id, ' +
        'imageurl FROM `image` WHERE topicid = ? ORDER BY datecreated DESC LIMIT 12; SELECT count(*) as imagescount ' +
        'FROM image WHERE topicid = ?;SELECT count(*) as followerscount FROM topicfollowing WHERE followed = ?',
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
                            status: result[0].status,
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

/// GET request for topic followers sorted by created date in descending order limit by 12
router.get('/topics/:id/followers', resourceExists, function(req, res){
    connection.query('SELECT id, name, description, imageurl FROM `topic` WHERE id = ?; SELECT u.id, u.username, ' +
        'u.imageurl from topicfollowing as tf inner join user as u on tf.following = u.id where tf.followed = ? ' +
        'ORDER BY tf.datecreated DESC LIMIT 12; SELECT count(*) as imagescount FROM image WHERE topicid = ?;' +
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
    // connection.query('SELECT following FROM topicfollowing WHERE id = ?', [req.params.id], function (error, results, fields) {
    //     // error will be an Error if one occurred during the query
    //     // results will contain the results of the query
    //     // fields will contain information about the returned results fields (if any)
    //     if (error) {
    //         throw error;
    //     }
    //     const userid = results[0].following;
    //     if (req.user.id !== userid) {
    //         res.redirect('/403');
    //     }
    //     connection.query('DELETE FROM topicfollowing WHERE id = ?', [req.params.id], function (error, results, fields) {
    //         // error will be an Error if one occurred during the query
    //         // results will contain the results of the query
    //         // fields will contain information about the returned results fields (if any)
    //         if (error) {
    //             throw error;
    //         }
    //         res.json({status: 'done'});
    //     });
    // });
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
