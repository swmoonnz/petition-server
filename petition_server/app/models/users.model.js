const db = require('../../config/db');

exports.checkToken = async function(token) {
    const connection = await db.getPool().getConnection()
    try {
        const sql = 'SELECT * FROM User where auth_token = ?'
        let [rows] = await connection.query(sql, token)
        connection.release()
        return rows;
    } catch(err) {
        connection.release()
        console.log("Error caught")
        return {"error": err};
    }
};

exports.checkEmail = async function(email) {
    const connection = await db.getPool().getConnection()
    try {
        const sql = 'SELECT * FROM User where email = ?'
        let [rows] = await connection.query(sql, email)
        connection.release()
        return rows[0].email;
    } catch(err) {
        connection.release()
        console.log("Error caught")
        return 0;
    }
};

exports.getOne = async function(userId) {
    const connection = await db.getPool().getConnection()
    try {
        const sql = 'SELECT * FROM User WHERE user_id = ?'
        let [rows] = await connection.query(sql, userId)
        connection.release()
        return rows;
    } catch(err) {
        connection.release()
        console.log("Error caught")
        return {"error": err};
    }
};

exports.registerUser = async function(userData) {
    const connection = await db.getPool().getConnection()
    try{
        let values = [
            userData.name, userData.email, userData.password, userData.city, userData.country
        ]

        const sql = 'INSERT INTO User (name, email, password, city, country) values (?,?,?,?,?)'
        let [result] = await connection.query(sql, values)
        connection.release()
        console.log(`Inserted user with id ${result.insertId}`)
        return {"id": result.insertId};
    } catch(err) {
        connection.release()
        console.log("Error caught")
        return {"error": err};
    }
};

exports.loginUser = async function(userData) {
    const connection = await db.getPool().getConnection()
    try{
        let values = [
            [userData.email]
        ]
        const sql = 'SELECT user_id, password, email FROM User WHERE email = ?'
        let [result] = await connection.query(sql, values)
        connection.release()
        console.log(`Returning hashed password and user id for user with email ${userData.email}`)
        return result;
    } catch(err) {
        connection.release()
        console.log("Error caught")
        return {"error": err};
    }
};

exports.insertToken = async function(token, userId) {
    const connection = await db.getPool().getConnection()
    try{
        let values = [
            [token], [userId]
        ]
        const sql = 'UPDATE User SET auth_token = ? where user_id = ?'
        let [result] = await connection.query(sql, values)
        connection.release()
        console.log(`Inserting token ${token} for user id ${userId}`)
        return token;
    } catch(err) {
        connection.release()
        console.log("Error caught")
        return {"error": err};
    }
};

exports.logoutUser = async function(tokenData) {
    const connection = await db.getPool().getConnection()
    try{
        let values = [
            [tokenData]
        ]
        const sql = 'UPDATE User SET auth_token = NULL where auth_token = ?'
        let [result] = await connection.query(sql, values)
        connection.release()
        console.log('Deleting token from the table')
        console.log(result)
        return result;
    } catch(err) {
        connection.release()
        console.log("Error caught")
        return {"error": err};
    }
};

exports.editUser = async function(userData) {
    const connection = await db.getPool().getConnection();
    try{
       let values = [
           [userData.name], [userData.email], [userData.password], [userData.city], [userData.country], [userData.id]
       ];
       const sql = 'UPDATE User SET name = ?, email = ?, password = ?, city = ?, country = ? WHERE user_id = ? '
       let [result] = await connection.query(sql, values)
       connection.release()
       console.log('User successfully updated')
       return result;

    } catch(err) {
        connection.release()
        console.log("Error caught")
        return {"error": err};
    }
};

exports.getOnePhoto = async function(userId) {
    const connection = await db.getPool().getConnection();
    try{
        const sql = 'SELECT photo_filename FROM User WHERE user_id = ?'
        let [rows] = await connection.query(sql, userId)
        connection.release()
        return rows;
    } catch(err) {
        connection.release()
        console.log("Error caught")
        return {"error": err};
    }
};

exports.updatePhoto = async function(photoName, id) {
    const connection = await db.getPool().getConnection()
    try{
        let values = [
            [photoName], [id]
        ]
        const sql = 'UPDATE User SET photo_filename = ? WHERE user_id = ?'
        const [result] = await connection.query(sql, values)
        connection.release()
        return result;
    } catch(err) {
        connection.release()
        console.log(err)
        return {"error": err};
    }
};

exports.deletePhoto = async function(id) {
    const connection = await db.getPool().getConnection()
    try{
        const q = 'UPDATE User SET photo_filename = NULL WHERE user_id = ?'
        const [result] = await connection.query(q, id)
        connection.release()
        return result;
    } catch(err) {
        connection.release()
        return {"error": err};
    }
};