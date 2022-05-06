const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString =
    `postgres://${process.env.DBUSER}:${process.env.DBPASSWORD}@${process.env.HOST}:${process.env.DATABASEPORT}/${process.env.DATABASE}`

const connection = {
    connectionString: process.env.DATABASE_URL ? process.env.DATABASE_URL : connectionString,
    ssl: { rejectUnauthorized: false }
}

const pool = new Pool(connection);

let userLocation = (lat1, long1, lat2, long2) => {
    let y = lat2 - lat1;
    let x = long2 - long1;

    return Math.sqrt(x * x + y * y);
};

let store = {
    /* Did not finish/
    getSearchResults: (search_term, radius_filter, maximum_results_to_return, category_filter, sort) => {
        return pool.query(`SELECT * FROM findnearbyplaces.places INNER JOIN findnearbyplaces.category ON findnearbyplaces.category.id = findnearbyplaces.places.category_id 
        WHERE findnearbyplaces.places.name LIKE '%($1)% OR findnearbyplaces.category.name like '%($1)%'`, [search_term])
            .then(x => {
                if (x.rows.length > 0) {
                    for(let i = 0; i< x.rows.length; i++) {
                        if (userLocation )
                    }
                }
            })
    },
    */

    addCustomer: (email, password) => {
        const hash = bcrypt.hashSync(password, 10);

        return pool.query(`INSERT INTO findnearbyplaces.customer (email, password) VALUES ($1, $2) `, [email, hash]);
    },

    login: (email, password) => {
        return pool.query('SELECT id, email, password FROM findnearbyplaces.customer WHERE email = $1', [email])
            .then(result => {
                if (result.rows.length == 1) {
                    let valid = bcrypt.compareSync(password, result.rows[0].password);
                    if (valid) {
                        return { valid: true, user: { id: result.rows[0].id, username: result.rows[0].email } };
                    } else {
                        return { valid: false, message: 'Invalid customer credentials.' };
                    }
                } else {
                    return { valid: false, message: 'Email not found.' };
                }
            });
    },

    addCategory: (name) => {
        return pool.query(`INSERT INTO findnearbyplaces.category (name) VALUES ($1) RETURNING id`, [name])
            .then(result => {
                if (result.rows.length == 1) {
                    return { done: true, id: result.rows[0].id, message: 'Category added successfully.' };
                } else {
                    return { done: false, id: null, message: 'Category was not added due to an error.' }
                }
            });
    },

    addPlace: (name, category_id, latitude, longitude, description) => {
        return pool.query(`INSERT INTO findnearbyplaces.place (name, category_id, latitude, longitude, description) VALUES ($1, $2, $3, $4, $5) RETURNING id`, [name, category_id, latitude, longitude, description])
            .then(result => {
                if (result.rows.length == 1) {
                    return { done: true, id: result.rows[0].id, message: 'Category added successfully.' };
                } else {
                    return { done: false, id: null, message: 'Category was not added due to an error.' }
                }
            });
    },

    updatePlace: (place_id, name, category_id, latitude, longitude, description) => {
        return pool.query(`UPDATE findnearbyplaces.place p SET name = COALESCE(($1), name),
                                                         category_id = COALESCE(($2), category_id),   
                                                         latitude = COALESCE(($3), latitude),
                                                         longitude = COALESCE(($4), longitude),
                                                         description = COALESCE(($5), description)
                                                         WHERE p.id = ($6)`,
            [name, category_id, latitude, longitude, description, place_id]);
    },

    deletePlace: (place_id) => {
        return pool.query(`DELETE FROM findnearbyplaces.place p WHERE p.id = ($1)`, [place_id]);
    },

    addPhoto: (photo, place_id, review_id) => {
        // need to convert photo to bytea --
        // WE NEVER WENT OVER THIS IN CLASS HOW AM I SUPPOSED TO DO THIS !?
        // let photoBytea = pg_read_binary_file(photo);

        return pool.query(`INSERT INTO findnearbyplaces.photo (file) VALUES ($1) RETURNING id`, [photo])
            .then(x => {
                if (x.rows.length == 1) {
                    // add to place_photo.
                    if (place_id != null) {
                        return pool.query(`INSERT INTO findnearbyplaces.place_photo (location_id, photo_id) VALUES ($1, $2)`, [place_id, x.rows[0].id])
                            .then(y => {
                                return { done: true, id: x.rows[0].id, message: 'Photo added successfully.' };
                            })
                            .catch(error => {
                                return { done: false, id: null, message: 'Photo was not added due to an error.' };
                            });
                    }
                }

                // add to review_photo.
                if (review_id != null) {
                    return pool.query(`INSERT INTO findnearbyplaces.review_photo (review_id, photo_id) VALUES ($1, $2)`, [review_id, x.rows[0].id])
                        .then(y => {
                            return { done: true, id: x.rows[0].id, message: 'Photo added successfully.' };
                        })
                        .catch(error => {
                            return { done: false, id: null, message: 'Photo was not added due to an error.' };
                        });
                }
            })
    },

    updatePhoto: (photo_id, photo) => {
        return pool.query(`UPDATE findnearbyplaces.photo p SET file = COALESCE(($1), file) WHERE p.id = ($2)`, [photo, photo_id]);
    },

    deletePhoto: (photo_id) => {
        return pool.query(`DELETE FROM findnearbyplaces.photo p WHERE p.id = ($1)`, [photo_id]);
    },

    addReview: (place_id, comment, rating) => {
        return pool.query(`INSERT INTO findnearbyplaces.review (location_id, text, rating) VALUES ($1, $2, $3) RETURNING id`, [place_id, comment, rating])
            .then(x => {
                if (x.rows.length == 1) {
                    return { done: true, id: x.rows[0].id, message: 'Review added successfully.' };
                } else {
                    return { done: false, id: null, message: 'Review was not added due to an error.' }
                }
            });
    },

    updateReview: (review_id, comment, rating) => {
        return pool.query(`UPDATE findnearbyplaces.review r SET text = COALESCE(($1), text),
                                                            rating = COALESCE(($2), rating)   
                                                            WHERE r.id = ($3)`,
            [comment, rating, review_id]);
    },

    deleteReview: (review_id) => {
        return pool.query(`DELETE FROM findnearbyplaces.review r WHERE r.id = ($1)`, [review_id]);
    }

}

module.exports = { store }; 