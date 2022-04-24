const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString =
    `postgres://${process.env.USER}:${process.env.PASSWORD}@${process.env.HOST}:${process.env.DATABASEPORT}/${process.env.DATABASE}`

const connection = {
    connectionString: process.env.DATABASE_URL ? process.env.DATABASE_URL : connectionString,
    ssl: { rejectUnauthorized: false }
}

const pool = new Pool(connection);




let store = {

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
        return pool.query(`INSERT INTO findnearbyplaces.category (name) VALUES ($1)`, [name]);
        /*
            .then(result => {
                if (result.rows.length == 1) {
                    return { done: true, id: result.rows[0].id, message: 'Category added successfully.' };
                } else {
                    return { done: false, id: null, message: 'Category was not added successfully.' }
                }
            })
        */
    }

    /*
    addPlace: (name, category_id, latitude, longitude, description) => {
        let category_id = ``;

        return pool.query(`INSERT INTO findnearbyplaces.place VALUES ($1, $2, $3, $4, $5, $6, $7)`, [name, category_id, latitude, longitude, description]);
    }
    */

}

module.exports = { store }; 