const Petition = require('../models/petitions.model');
const photoDirectory = 'storage/photos/';
const fs = require('mz/fs');

// Return all petitions
exports.getPetitions = async function(req,res){
    try{
        let queryString = ''
        const params = req.query;
        let sort = req.query.sortBy ? `${req.query.sortBy}` : 'ORDER BY signatureCount DESC'
        if (sort === 'ALPHABETICAL_ASC') {
            sort = 'ORDER BY Petition.title '
        } else if (sort === 'ALPHABETICAL_DESC') {
            sort = 'ORDER BY Petition.title DESC '
        } else if (sort === 'SIGNATURES_ASC') {
            sort = ' ORDER BY signatureCount ASC'
        }
        if (Object.keys(params).length != 0) {
            if (typeof(params.categoryId) != 'undefined') {
                queryString += `Category.category_id = ${params.categoryId} `
            }
            if (typeof(params.authorId) != 'undefined') {
                if (queryString === '') {
                    queryString += `Petition.author_id = ${params.authorId} `
                }
                else {d
                    queryString += `AND Petition.author_id = ${params.authorId} `
                }
            }
            if (typeof(params.q) != 'undefined') {
                if (queryString === ''){
                    queryString += `Petition.title LIKE '%${params.q}%'`
                }
                else {
                    queryString += `AND Petition.title LIKE '%${params.q}%'`
                }
            }
            let count = params.count ? `${params.count}` : 500
            let startIndex = params.startIndex ? `${params.startIndex}, ` : ''
            let limit = 'LIMIT ' + startIndex + count
            let query = queryString ? `WHERE ${queryString} ` : ''
            let result = await Petition.getAllParameters(query, sort, limit)
            if (result.error) {
                res.status(400).send()
                return;
            }
            else {
                res.status(200)
                    .send(result)
                return;
            }
        }
        if (Object.keys(params).length == 0) {
            let result = await Petition.getAll();
            if (result.error) {
                res.status(400).send()
                return;
            }
            else {
                res.status(200)
                    .send(result)
                return;
            }
        }
    }   catch(err) {
        res.status(500)
            .send(`ERROR fetching petitions ${err}`)
        return;
    }
};

exports.addPetition = async function(req,res){
    try{
        console.log(req.body.title)
        var token = req.get('X-Authorization')
        const dbData = await Petition.getUserByToken(token)
        if(!dbData.length||dbData == 'undefined') {
            res.status(401).send()
            return;
        }
        if (Object.keys(req.body).length == 0) {
            console.log('Body is empty')
            res.status(400).send()
            return;
        }
        if (!req.body.title) {
            console.log(req.body.title)
            res.status(400).send()
            return;
        }
        const categoryData = await Petition.getPetitionCategory(req.body.categoryId)
        if (!categoryData.length||categoryData == 'undefined'){
            res.status(400).send('Category does not exist')
            return;
        }
        // else if (categoryData) { ***
        const created_date = new Date()
        const petition_date = req.body.closingDate
        const current_date = Date.now()
        if (current_date > petition_date) {
            res.status(411).send()
            return;
        }
        else {
            let user_data = {
                "title": req.body.title,
                "description": req.body.description,
                "author_id": dbData[0].user_id,
                "category_id": req.body.categoryId,
                "created_date": created_date,
                "closing_date": req.body.closingDate
            }
            let result = await Petition.insertPetition(user_data)
            res.status(201).json({
                "petitionId": result.insertId
            })
            return;
        }

    } catch (err) {
        res.status(500)
            .send()
        return;
    }
};

exports.getPetitionById = async function(req,res) {
    try {
        const checkPetition = await Petition.checkPetitionExists(req.params.id)
        if (!checkPetition.length||checkPetition=='undefined'){
            res.status(404).send()
            return;
        }
        else {
            const id = req.params.id;
            let result = await Petition.getOne(id);
            res.status(200).send(result[0])
            return;
        }
    } catch (err) {
        res.status(500)
            .send()
        return;
    }
};

exports.editPetition = async function(req,res){
    try {
        var token = req.get('X-Authorization')
        const petition_id = req.params.id
        let found_petition = await Petition.checkPetitionExists(petition_id)
        if (!found_petition.length) {
            console.log('Petition not found')
            res.status(400).send()
            return;
        }
        if (Object.keys(req.body).length === 0) {
            console.log('Body is empty')
            res.status(400).send()
            return;
        }
        found_petition = found_petition[0]
        let title = req.body.title ? req.body.title : found_petition.title
        let description = req.body.description ? req.body.description: found_petition.description
        let categoryId = req.body.categoryId ? req.body.categoryId: found_petition.category_id
        let closingDate = req.body.closingDate ? req.body.closingDate: found_petition.closing_date

        const token_check = await Petition.checkToken(token)
        if (!token_check.length) {
            res.status(403).send()
            return;
        }
        if (token_check[0].user_id != found_petition.author_id){
            res.status(403).send()
            return;
        }
        if (token_check[0].user_id == found_petition.author_id){
            petition_data = {
                "title": title,
                "description": description,
                "category_id": categoryId,
                "closingDate": closingDate,
                "petition_id": petition_id
            }
            let result = await Petition.editPetition(petition_data)
            res.status(200)
                .send()
            return;
        }
    } catch(err) {
        res.status(500)
            .send(`ERROR posting email ${err}`)
        return;

    }
};

exports.removePetition = async function(req,res) {
    try {
        var token = req.get('X-Authorization')
        const petition_id = req.params.id
        let found_petition = await Petition.checkPetitionExists(petition_id)
        if (!found_petition.length) {
            res.status(404).send()
            return;
        }
        const token_check = await Petition.checkToken(token)
        if (!token_check.length) {
            res.status(401).send()
            return;
        }
        if (token_check[0].user_id != found_petition[0].author_id) {
            res.status(403).send()
            return;
        }
        if (token_check[0].user_id == found_petition[0].author_id) {
            await Petition.deletePetition(petition_id)
            res.status(200).send()
            return;
        }
    } catch(err) {
        res.status(500)
            .send()
        return;
    }
};


exports.getPetitionCategories = async function(req,res){
    try {
        let result = await Petition.retrieveCategories();
        res.status(200).send(result)
        return;
    } catch (err) {
        res.status(500)
            .send()
        return;
    }
};

exports.getPetitionPhoto = async function(req,res){
    try {
        const petition_id = req.params.id;
        let found_petition = await Petition.checkPetitionExists(petition_id);
        if (!found_petition.length) {
            res.status(404).send()
            return;
        }
        let result = await Petition.getPhoto(petition_id)
        if (!result.length) {
            res.status(404).send()
            return;
        }
        let photo_filename = result[0].photo_filename;
        const photoDir = `${photoDirectory}${photo_filename}`
        res.download(photoDir)
        return;

    } catch(err) {
        res.status(500)
            .send()
        return;
    }
};


exports.setPetitionPhoto = async function(req,res) {
    try {
        const image = req.body
        const petition_id = req.params.id
        const photoTypes = ["png", "jpeg", "gif", "jpg"]
        let found_petition = await Petition.checkPetitionExists(petition_id)
        if (!found_petition.length) {
            console.log('Petition not found')
            res.status(404).send()
            return;
        }
        let contentType = req.get('Content-Type')
        let token = req.get('X-Authorization')
        let photoType = contentType.split("/")
        photoType = photoType[1]
        let photoName = `petition_${petition_id}.${photoType}`
        if (!photoTypes.includes(photoType)) {
            res.status(400).send()
            return;
        }
        if(photoTypes.includes(photoType)) {
            const token_check = await Petition.checkToken(token)
            if (!token_check.length) {
                res.status(401).send()
                return;
            }
            if (token_check[0].user_id != found_petition[0].author_id) {
                res.status(403).send()
                return;
            }
            if (token_check[0].user_id == found_petition[0].author_id) {
                await fs.writeFile(`${photoDirectory}${photoName}`, req.body, "binary", () => {
                })
                const result = await Petition.updatePetitionPhoto(photoName, petition_id)
                if (found_petition[0].photo_filename == null) {
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

exports.getPetitionSignatures = async function(req,res) {
    try {
        const checkPetition = await Petition.checkPetitionExists(req.params.id)
        if (!checkPetition.length||checkPetition=='undefined') {
            res.status(404).send()
            return;
        }
        else {
            const petition_id = req.params.id;
            let result = await Petition.getSignatures(petition_id)
            res.status(200).send(result)
            return;
        }
    } catch (err) {
        res.status(500)
            .send()
        return;
    }
};

exports.signPetition = async function(req,res){
    try{
        var token = req.get('X-Authorization')
        const petition_id = req.params.id
        const found_user = await Petition.getUserByToken(token)
        if(!found_user.length) {
            res.status(401).send()
            return;
        }
        const found_petition = await Petition.checkPetitionExists(petition_id)
        if(!found_petition.length){
            res.status(404).send()
            return;
        }
        const user_id = found_user[0].user_id
        const closing_date = found_petition[0].closing_date
        const current_date = Date.now()
        if (closing_date <= current_date) {
            res.status(403).send('Forbidden: cannot sign a petition that has closed')
            return;
        }
        const signed_date = new Date()
        const result = await Petition.addSignature(user_id, petition_id, signed_date)
        if (result.error) {
            res.status(403).send('Forbidden: cannot sign a petition more than once')
            return;
        }
        else {
            res.status(201).send()
            return;
        }
    } catch (err) {
        res.status(500)
            .send()
        return;
    }
};

exports.removeSignature = async function(req,res) {
    try{
        let token = req.get('X-Authorization')
        let petition_id = req.params.id
        let found_user = await Petition.getUserByToken(token)
        if(!found_user.length) {
            res.status(401).send()
            return;
        }
        let found_petition = await Petition.checkPetitionExists(petition_id)
        if(!found_petition.length){
            res.status(404).send()
            return;
        }
        let closing_date = found_petition[0].closing_date
        let current_date = Date.now()
        if (closing_date <= current_date) {
            res.status(403).send('Forbidden: petition has closed')
            return;
        }
        let userId = found_user[0].user_id
        let hasUserAlreadySigned = await Petition.checkUserSignature(userId, petition_id)
        if (!hasUserAlreadySigned.length) {
            res.status(403).send(`ERROR: Forbidden. No signature to delete`)
            return;
        }
        let authorId = found_petition[0].author_id
        if (authorId == userId){
            res.status(404).send('ERROR: Author cannot sign their own petition')
            return;
        }
        await Petition.deleteSignature(userId, petition_id)
        res.status(200).send('Signature deleted')
        return;
    } catch (err) {
        console.log(err)
        res.status(500)
            .send()
        return;
    }
};


