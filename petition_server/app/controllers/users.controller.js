const User = require('../models/users.model');
const cryptoRandomString = require('crypto-random-string');
const fs = require('mz/fs');
const photoDirectory = 'storage/photos/';
const crypto = require('crypto')

exports.getUser = async function(req,res){
    try {
        var token = req.get('X-Authorization')
        const id = req.params.id
        const result = await User.getOne(id)
        if (!result.length) {
            res.status(404).send()
            return;
        }
        if (result == "undefined") {
            res.status(404).send()
            return;
        }
        const name = result[0].name
        const city = result[0].city
        const country = result[0].country
        const email = result[0].email
        const token_check = await User.checkToken(token)
        if (token_check.length > 0) {
            res.status(200)
                .send({
                    "name": name,
                    "city": city,
                    "country": country,
                    "email": email
                })
            return;
        }
        else {
            res.status(200)
                .send({
                    "name": result[0].name,
                    "city": result[0].city,
                    "country": result[0].country,
                })
            return;
        }
    }   catch ( err ) {
            res.status(500)
                .send(`ERROR fetching user ${err}`)
            return;
    }
};

exports.create = async function(req,res){
        try {
            const name = req.body.name
            const email = req.body.email
            const password = req.body.password
            const city = req.body.city
            const country = req.body.country
            if (!validateEmail(req.body.email)) {
                res.status(400)
                    .send(`Email address ${req.body.email} is invalid`)
                return;
            }
            if (name == 'undefined' || name == '') {
                res.status(400)
                    .send()
                return;
            }
            if (!checkPasswordLength(req.body.password)) {
                res.status(400)
                    .send(`Password cannot be empty`)
                return;
            }
            const  hashedPassword = getPasswordHash(password)
            let user_data = {
                "name": name,
                "email": email,
                "password": hashedPassword,
                "city": city,
                "country": country
            }
            const result = await User.registerUser(user_data);
            if (result.error) {
                res.status(400).send()
                return;
            } else {
                res.status(201)
                    .send({
                        "userId": result.id
                    })
                return;
            }
        }
        catch (err) {
            res.status(500)
                .send(`ERROR posting user ${err}`)
            return;
        }
};

exports.login = async function(req,res){
    try {
        const password = req.body.password
        const user_data = {
            "email": req.body.email
        };
        if (!validateEmail(req.body.email)) {
            res.status(400).send()
            return;
        }
        const result = await User.loginUser(user_data)
        if (result.length == 0) {
            res.status(400).send()
            return;
        }
        if (getPasswordHash(password) == result[0].password){
            const token = cryptoRandomString({length:8})
            const auth_token = await User.insertToken(token, result[0].user_id)
            res.status(200)
                .json({
                    userId: result[0].user_id,
                    token: auth_token
                })
            return;
        }
        else {
            res.status(400)
                .send('Bad Request');
            return;
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR posting email ${err}`)
        return;
    }
};

exports.logout = async function(req,res){
    try {
        var token = req.get('X-Authorization')
        const result = await User.logoutUser(token)
        if (result.changedRows == 0) {
            res.status(401)
                .send('Bad Request')
            return;
        } else {
            res.status(200)
                .send()
            return;
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR posting email ${err}`)
        return;
    }
};

exports.edit =  async function(req,res) {
    try {
        var token = req.get('X-Authorization')
        const id = req.params.id
        let found_user = await User.getOne(id)
        if (!found_user.length) {
            res.status(400).send()
            return;
        }
        if (Object.keys(req.body).length === 0) {
            res.status(400).send()
            return;
        }
        if (typeof(req.body.email) != 'undefined') {
            let emailCheck = await User.checkEmail(req.body.email)
            if (emailCheck.length > 0) {
                console.log('Email is already in use')
                res.status(400).send()
                return;
            }
        }
        found_user = found_user[0];
        let name = req.body.name ? req.body.name : found_user.name
        let email = req.body.email ? req.body.email: found_user.email
        let password = req.body.password ? req.body.password: found_user.password
        let city = req.body.city ? req.body.city: found_user.city
        let country = req.body.country ? req.body.country: found_user.country

        if (!validateEmail(email)) {
            console.log('Invalid Email format')
            res.status(400).send()
            return;
        }
        if (req.body.currentPassword == 'undefined'){
            res.status(400).send()
            return;
        }
        if (getPasswordHash(req.body.currentPassword) != found_user.password) {
            res.status(400).send()
            return;
        }
        const token_check = await User.checkToken(token)
        if (!token_check.length) {
            res.status(401).send()
            return;
        }
        if (id != found_user.user_id) {
            res.status(403).send()
            return;
        }
        password = getPasswordHash(password)
        user_data = {
            "name": name,
            "email": email,
            "password": password,
            "city": city,
            "country": country
        }
        let result = await User.editUser(user_data)
        res.status(200)
            .send(result)
            return;
    } catch(err) {
        res.status(500)
            .send(`ERROR posting email ${err}`)
            return;
    }
};

exports.getPhoto = async function(req,res) {
    try {
        const id = req.params.id;
        let result = await User.getOnePhoto(id)
        let photo_filename = result[0].photo_filename
        if (!result.length) {
            res.status(404).send()
            return;
        }
        const photoDir = `${photoDirectory}${photo_filename}`;
        res.download(photoDir)
    } catch(err) {
        res.status(500)
            .send()
        return;
    }
};

exports.setPhoto = async function(req,res) {
    try {
        const image = req.body
        const id = req.params.id
        const photoTypes = ["png", "jpeg", "gif", "jpg"]
        let found_user = await User.getOne(id)
        if (!found_user.length) {
            console.log('User not found')
            res.status(404).send()
            return;
        }
        let contentType = req.get('Content-Type')
        let token = req.get('X-Authorization')
        let photoType = contentType.split("/")
        photoType = photoType[1]
        let photoName = `user_${id}.${photoType}`
        console.log(photoType)
        if (!photoTypes.includes(photoType)) {
            res.status(400).send()
            return;
        }
        if(photoTypes.includes(photoType)) {
            const token_check = await User.checkToken(token)
            if (!token_check.length) {
                res.status(401).send()
                return;
            }
            if (token_check[0].user_id != id) {
                res.status(403).send()
                return;
            }
            if (token_check[0].user_id == id) {
                await fs.writeFile(`${photoDirectory}${photoName}`, req.body, "binary", () => {
                })
                const result = await User.updatePhoto(photoName, id)
                if (found_user[0].photo_filename == null) {
                    res.status(201).send('Created')
                    return;
                }
                res.status(200).send('OK')
                return;
            }
        }
    } catch(err) {
        res.status(500)
            .send()
            return;
    }
};

exports.removePhoto = async function(req,res) {
    try {
        const id = req.params.id
        const token = req.get('X-Authorization')
        let found_user = await User.getOne(id)
        if (!found_user.length) {
            res.status(404).send()
            return;
        }
        let token_check = await User.checkToken(token)
        if (!token_check.length) {
            res.status(401).send()
            return;
        }
        if (token_check[0].user_id != id) {
            res.status(403).send()
            return;
        }
        if (token_check[0].user_id == id) {
            await User.deletePhoto(id)
            res.status(200).send()
            return;
        }
    } catch(err) {
        res.status(500)
            .send()
        return;
    }
};


// Checks if the email address is a valid address or not, by returning a boolean value.
function validateEmail(email) {
    // console.log(`Validating email address ${email}`);
    var re =/\S+@\S+/
    return re.test(String(email).toLowerCase());
};

// Checks that the password length is greater than zero.
function checkPasswordLength(password) {
    return password.length > 0;
};

function getPasswordHash(password) {
    if (password === undefined) {
        throw "Password is undefined, cannot generate hash.";
    }
    // Synchronously create a hash of a password (wit blank salt), iterating 1000 times, for a length of 64,
    // with digest sha512
    return crypto.pbkdf2Sync(password, "", 1000, 64, `sha512`).toString(`hex`);
}

