const express = require('express');
const cors = require('cors');

var passport = require('passport');
var LocalStrategy = require('passport-local');
var session = require('express-session');
var SQLiteStore = require('connect-sqlite3')(session);

const { store } = require('./data_access/store');

const application = express();
const port = process.env.PORT || 4002;

// ------------------------------------------------// MIDDLEWARE //----------------------------------------------------- //
application.use(express.json());
application.use(cors());

application.use((request, response, next) => {
    console.log(`request url: ${request.url}`);
    console.log(`request method: ${request.method}`);
    // only 4 debugging. remove when submitting.
    console.log(`request body:`); //
    console.log(request.body); //
    next();
})

// login verification 
passport.use(new LocalStrategy({ usernameField: 'email' }, function verify(username, password, cb) {
    store.login(username, password)
        .then(x => {
            if (x.valid) {
                return cb(null, x.user);
            } else {
                return cb(null, false, { message: 'Incorrect username or password.' });
            }
        })
        .catch(error => {
            console.log(error);
            cb('Something went wrong...');
        });
}));

// session authentication
application.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStore({ db: 'sessions.db', dir: './sessions' })
}));

application.use(passport.authenticate('session'));

// serialize / deserialize users
passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});
//


// ----------------------------------------------------// METHODS //------------------------------------------------- //

// HOME //
application.get('/', (request, response) => {
    response.status(200).json({ done: true, message: 'Welcome to findnearbyplaces-api' });
});

// CUSTOMER //
application.post('/customer', (request, response) => {
    let email = request.body.email;
    let password = request.body.password;

    store.addCustomer(email, password)
        .then(x => response.status(200).json({ done: true, message: 'Customer added successfully.' }))
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Customer was not added due to an error.' })
        });
})

// LOGIN //
application.post('/login', passport.authenticate('local', {
    successRedirect: '/login/succeeded',
    failureRedirect: '/login/failed'
}));

application.get('/login/succeeded', (request, response) => {
    response.status(200).json({ done: true, message: 'Customer logged in successfully.' });
});

application.get('/login/failed', (request, response) => {
    response.status(401).json({ done: false, message: 'Invalid customer credentials.' });
});

// CATEGORY //
application.post('/category', (request, response) => {
    let name = request.body.name;

    store.addCategory(name)
        .then(x => response.status(200).json({ done: true, message: 'Category added successfully.' }))
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Category was not added due to an error.' })
        });
});





// PLACE // 
/*
application.post('/place', (request, response) => {
    let name = request.body.name;
    let category_id = request.body.category_id;
    let latitude = request.body.latitude;
    let longitude = request.body.longitude;
    let description = request.body.description;

    store.addPlace(name, category_id, latitude, longitude, description)
        .then(x => response.status(200).json({ done: true, message: 'Place added successfully.' }))
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Place was not added due to an error.' })
        });
});
*/










// LISTENER //
application.listen(port, () => {
    console.log(`Listening to port ${port} `);
});