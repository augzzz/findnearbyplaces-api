const express = require('express');
const cors = require('cors');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var session = require('express-session');
var SQLiteStore = require('connect-sqlite3')(session);
const { store } = require('./data_access/store');

const application = express();
const port = process.env.PORT || 4002;

// LOCAL USE //
let backendURL = 'http://localhost:4002';
let frontEndURL = 'http://localhost:3000';

// ------------------------------------------------// MIDDLEWARE //----------------------------------------------------- //
application.use(cors({
    origin: frontEndURL,
    credentials: true
}));

application.use(express.json());

application.use((request, response, next) => {
    console.log(`request url: ${request.url}`);
    console.log(`request method: ${request.method}`);
    // only 4 debugging. remove when submitting.
    //console.log(`request body:`); //
    //console.log(request.body); //
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

// SEARCH //
application.get('/search', (request, response) => {
    let search_term = request.body.search_term;
    let radius_filter = request.body.radius_filter;
    let maximum_results_to_return = request.body.maximum_results_to_return;
    let category_filter = request.body.category_filter;
    let sort = request.body.sort;

    store.getSearchResult(search_term, radius_filter, maximum_results_to_return, category_filter, sort)
        .then(x => response.status(200).json({ done: true, message: 'Customer added successfully.' }))
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Customer was not added due to an error.' })
        });

});

// CUSTOMER //
application.post('/customer', (request, response) => {
    console.log(request.body); // UNDEFINED
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

application.post('/logout', (request, response) => {
    request.logout();
    response.json({ done: true, message: 'Customer signed out successfully.' })
});

// CATEGORY //
application.post('/category', (request, response) => {
    let name = request.body.name;

    store.addCategory(name)
        .then(x => response.status(200).json({ done: true, id: x.id, message: 'Category added successfully.' }))
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Category was not added due to an error.' })
        });
});

// PLACE // 
application.post('/place', (request, response) => {
    if (!request.isAuthenticated()) {
        response.status(401).json({ done: false, message: 'Please log in first.' });
    }

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

application.put('/place', (request, response) => {
    if (!request.isAuthenticated()) {
        response.status(401).json({ done: false, message: 'Please log in first.' });
    }

    let place_id = request.body.place_id;
    let name = request.body.name;
    let category_id = request.body.category_id;
    let latitude = request.body.latitude;
    let longitude = request.body.longitude;
    let description = request.body.description;

    store.updatePlace(place_id, name, category_id, latitude, longitude, description)
        .then(x => response.status(200).json({ done: true, message: 'Place updated successfully.' }))
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Place was not updated due to an error.' })
        });
});

application.delete('/place', (request, response) => {
    if (!request.isAuthenticated()) {
        response.status(401).json({ done: false, message: 'Please log in first.' });
    }

    let place_id = request.body.place_id;

    store.deletePlace(place_id)
        .then(x => response.status(200).json({ done: true, message: 'Place deleted successfully.' }))
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Place was not deleted due to an error.' })
        });
});
//

// PHOTO //
application.post('/photo', (request, response) => {
    let photo = request.body.photo;
    let place_id = request.body.place_id;
    let review_id = request.body.review_id;

    store.addPhoto(photo, place_id, review_id)
        .then(x => response.status(200).json({ done: true, message: 'Photo added successfully.' }))
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Photo was not added due to an error.' })
        });
});

application.put('/photo', (request, response) => {
    if (!request.isAuthenticated()) {
        response.status(401).json({ done: false, message: 'Please log in first.' });
    }

    let photo_id = request.body.photo_id;
    let photo = request.body.photo;

    store.updatePhoto(photo_id, photo)
        .then(x => response.status(200).json({ done: true, message: 'Photo updated successfully.' }))
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Photo was not updated due to an error.' })
        });
});

application.delete('/photo', (request, response) => {
    let photo_id = request.body.photo_id;

    store.deletePhoto(photo_id)
        .then(x => response.status(200).json({ done: true, message: 'Photo deleted successfully.' }))
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Photo was not deleted due to an error.' })
        });
});
//

// REVIEW //
application.post('/review', (request, response) => {
    if (!request.isAuthenticated()) {
        response.status(401).json({ done: false, message: 'Please log in first.' });
    }

    let place_id = request.body.place_id;
    let comment = request.body.comment;
    let rating = request.body.rating;

    store.addReview(place_id, comment, rating)
        .then(x => response.status(200).json({ done: true, message: 'Review added successfully.' }))
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Review was not added due to an error.' })
        });
});

application.put('/review', (request, response) => {
    if (!request.isAuthenticated()) {
        response.status(401).json({ done: false, message: 'Please log in first.' });
    }

    let review_id = request.body.review_id
    let comment = request.body.comment;
    let rating = request.body.rating;

    store.updateReview(review_id, comment, rating)
        .then(x => response.status(200).json({ done: true, message: 'Review updated successfully.' }))
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Review was not updated due to an error.' })
        });
});

application.delete('/review', (request, response) => {
    if (!request.isAuthenticated()) {
        response.status(401).json({ done: false, message: 'Please log in first.' });
    }

    let review_id = request.body.review_id;

    store.deleteReview(review_id)
        .then(x => response.status(200).json({ done: true, message: 'Review deleted successfully.' }))
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Review was not deleted due to an error.' })
        });
});
//

// LISTENER //
application.listen(port, () => {
    console.log(`Listening to port ${port} `);
});