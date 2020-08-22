const db = require('../../config/db');

exports.getAll = async function() {
    const connection = await db.getPool().getConnection()
    try {
        const sql = 'SELECT DISTINCT Petition.petition_id AS petitionId, Petition.title, Category.name AS category, User.name AS authorName, ' +
            '(select count(*) from Signature where Signature.petition_id = Petition.petition_id) AS signatureCount ' +
            'FROM Petition ' +
            'JOIN Category ON Petition.category_id = Category.category_id ' +
            'JOIN User ON User.user_id = Petition.author_id ' +
            'JOIN Signature ON Signature.petition_id = Petition.petition_id ' +
            'ORDER BY signatureCount DESC'
        const [rows] = await connection.query(sql)
        connection.release()
        return rows;
    } catch(err) {
        connection.release()
        console.log("Error caught")
        return {"error": err};
    }
};

exports.getAllParameters = async function(queryString, sort, limit) {
    const connection = await db.getPool().getConnection()
    try {
        const sql = 'SELECT DISTINCT Petition.petition_id AS petitionId, Petition.title, Category.name AS category, User.name AS authorName, ' +
            '(select count(*) from Signature where Signature.petition_id = Petition.petition_id) AS signatureCount ' +
            'FROM Petition ' +
            'JOIN Category ON Petition.category_id = Category.category_id ' +
            'JOIN User ON User.user_id = Petition.author_id ' +
            'LEFT JOIN Signature ON Signature.petition_id = Petition.petition_id ' +
            `${queryString}` +
            `${sort}` +
            ` ${limit}`
        const [rows] = await connection.query(sql, queryString, sort, limit)
        connection.release()
        return rows;
    } catch(err) {
        connection.release()
        console.log("Error caught")
        return {"error": err};
    }
};

exports.getUserByToken = async function(token) {
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

exports.getPetitionCategory = async function(categoryId){
    const connection = await db.getPool().getConnection()
    try{
        const sql = 'SELECT * FROM Category where category_id = ?'
        let [rows] = await connection.query(sql, categoryId)
        connection.release()
        return rows;
    } catch(err) {
        connection.release()
        console.log("Error caught")
        return {"error": err};
    }
};

exports.insertPetition = async function(userData) {
    const connection = await db.getPool().getConnection()
    try{
        let values = [
            userData.title, userData.description, userData.author_id, userData.category_id, userData.created_date, userData.closing_date
        ]
        const sql = 'INSERT INTO Petition (title, description, author_id, category_id, created_date, closing_date) values (?,?,?,?,?,?)'
        let [result] = await connection.query(sql, values)
        connection.release()
        return result;
    } catch(err) {
        connection.release()
        console.log("Error caught")
        return {"error": err};
    }
};


exports.getOne = async function(petitionId) {
    const connection = await db.getPool().getConnection()
    try{
        const sql = 'SELECT DISTINCT Petition.petition_id AS petitionId, Petition.title, Petition.description, Petition.author_id ' +
            'AS authorId, User.name AS authorName, User.city AS authorCity, User.country AS authorCountry, ' +
            '(select count(*) from Signature where Signature.petition_id = Petition.petition_id) AS signatureCount, ' +
            'Category.name AS category, Petition.created_date AS createdDate, Petition.closing_date AS closingDate ' +
            'FROM Petition ' +
            'JOIN Category ON Petition.category_id = Category.category_id ' +
            'JOIN User ON User.user_id = Petition.author_id ' +
            'JOIN Signature ON Signature.petition_id = Petition.petition_id ' +
            'WHERE Petition.petition_id = ? ' +
            'ORDER BY signatureCount DESC'
        let [rows] = await connection.query(sql, petitionId)
        connection.release()
        return rows;
    } catch(err) {
        connection.release()
        console.log("Error caught")
        return {"error": err};
    }
};

exports.checkPetitionExists = async function(id){
    const connection = await db.getPool().getConnection()
    try{
        const sql = 'SELECT * FROM Petition WHERE petition_id = ?'
        let [rows] = await connection.query(sql, id)
        connection.release()
        return rows;
    } catch(err) {
        consnection.release()
        console.log("Error caught")
        return {"error": err};
    }
};

exports.checkToken = async function(token) {
    const connection = await db.getPool().getConnection();
    try {
        const sql = 'SELECT * FROM User where auth_token = ?';
        let [rows] = await connection.query(sql, token);
        connection.release();
        return rows;
    } catch(err) {
        connection.release();
        console.log("Error caught");
        return {"error": err}
    }
};

exports.editPetition = async function(petitionData) {
    const connection = await db.getPool().getConnection()
    try{
        let values = [
            [petitionData.title], [petitionData.description], [petitionData.category_id], [petitionData.closingDate], [petitionData.petition_id]
        ];
        const sql = 'UPDATE Petition SET title = ?, description = ?, category_id = ?, closing_date = ? WHERE petition_id = ? '
        let [result] = await connection.query(sql, values)
        connection.release()
        return result;
    } catch(err) {
        connection.release()
        console.log("Error caught")
        return {"error": err};
    }
};

exports.deletePetition = async function(id) {
    const connection = await db.getPool().getConnection()
    try{
        const q = 'DELETE FROM Petition WHERE petition_id = ?'
        const [result] = await connection.query(q, id)
        connection.release()
        return result;
    } catch(err) {
        connection.release()
        return {"error": err};
    }
};

exports.retrieveCategories = async function() {
    const connection = await db.getPool().getConnection()
    try{
        const q = 'SELECT category_id AS categoryId, name FROM Category'
        const [rows] = await connection.query(q)
        connection.release()
        return rows;
    } catch(err) {
        connection.release()
        return {"error": err};
    }
};

exports.getPhoto = async function(petitionId) {
    const connection = await db.getPool().getConnection()
    try{
        const sql = 'SELECT photo_filename FROM Petition WHERE petition_id = ?'
        let [rows] = await connection.query(sql, petitionId);
        connection.release()
        return rows;
    } catch(err) {
        connection.release()
        console.log("Error caught")
        return {"error": err};
    }
};

exports.updatePetitionPhoto = async function(photoName, petitionId) {
    const connection = await db.getPool().getConnection()
    try{
        let values = [
            [photoName], [petitionId]
        ]
        const sql = 'UPDATE Petition SET photo_filename = ? WHERE petition_id = ?'
        const [result] = await connection.query(sql, values)
        connection.release()
        return result;
    } catch(err) {
        connection.release()
        console.log(err)
        return {"error": err};
    }
};


exports.getSignatures = async function(petitionId) {
    const connection = await db.getPool().getConnection()
    try{
        const sql = 'SELECT signatory_id AS signatoryId, User.name, User.city, User.country, signed_date AS signedDate ' +
            'FROM Signature JOIN User ON Signature.signatory_id = User.user_id ' +
            'WHERE petition_id = ? ' +
            'ORDER BY signed_date ASC'
        let [rows] = await connection.query(sql, petitionId)
        connection.release()
        return rows;
    } catch(err) {
        connection.release()
        console.log("Error caught")
        return {"error": err}
    }
};

exports.addSignature = async function(signatory_id, petition_id, signed_date){
    const connection = await db.getPool().getConnection()
    try{
        let values = [[signatory_id], [petition_id], [signed_date]]
        const sql = 'INSERT INTO Signature (signatory_id, petition_id, signed_date) values (?,?,?)'
        let [rows] = await connection.query(sql, values)
        connection.release()
        return rows;
    } catch(err) {
        connection.release()
        console.log("Error caught" + err)
        return {"error": err}
    }
};

exports.checkUserSignature = async function(userId, petitionId) {
    const connection = await db.getPool().getConnection()
    try{
        const sql = 'SELECT * FROM Signature WHERE signatory_id = ? AND petition_id = ?'
        let [rows] = await connection.query(sql, [userId, petitionId]);
        connection.release()
        return rows;
    } catch(err) {
        connection.release()
        console.log("Error caught");
        return {"error": err};
    }
};

exports.deleteSignature = async function(userId, petition_id) {
    const connection = await db.getPool().getConnection()
    try{
        const sql = 'DELETE FROM Signature WHERE signatory_id = ? AND petition_id = ?'
        let [rows] = await connection.query(sql, [userId, petition_id]);
        connection.release()
        return rows;
    } catch(err) {
        connection.release()
        console.log("Error caught")
        return {"error": err};
    }
};