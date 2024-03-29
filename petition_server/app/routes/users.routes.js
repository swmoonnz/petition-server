const users = require('../controllers/users.controller');

module.exports = function(app){
    app.route(app.rootUrl + '/users/:id')
        .get(users.getUser);

    app.route(app.rootUrl + '/users/register')
        .post(users.create);

    app.route(app.rootUrl + '/users/login')
        .post(users.login);

    app.route(app.rootUrl + '/users/logout')
        .post(users.logout);

    app.route(app.rootUrl + '/users/:id')
        .patch(users.edit);

    app.route(app.rootUrl + '/users/:id/photo')
        .get(users.getPhoto)
        .put(users.setPhoto)
        .delete(users.removePhoto);
};