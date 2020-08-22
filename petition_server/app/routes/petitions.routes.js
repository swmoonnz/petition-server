const petitions = require('../controllers/petitions.controller');

module.exports = function(app){
    app.route(app.rootUrl + '/petitions')
        .get(petitions.getPetitions)
        .post(petitions.addPetition);

    app.route(app.rootUrl + '/petitions/categories')
        .get(petitions.getPetitionCategories);

    app.route(app.rootUrl + '/petitions/:id/photo')
        .get(petitions.getPetitionPhoto)
    .put(petitions.setPetitionPhoto);

    app.route(app.rootUrl + '/petitions/:id/signatures')
        .get(petitions.getPetitionSignatures)
        .delete(petitions.removeSignature)
        .post(petitions.signPetition);

    app.route(app.rootUrl + '/petitions/:id')
        .get(petitions.getPetitionById)
        .delete(petitions.removePetition)
        .patch(petitions.editPetition);
};