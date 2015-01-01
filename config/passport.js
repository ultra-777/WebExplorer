'use strict';

var passport = require('passport'),
	db = require('../server/models/storage/db'),
	path = require('path'),
	config = require('./config'),
	uc = require('./userCache');

module.exports = function() {
	// Serialize sessions
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	// Deserialize sessions
	passport.deserializeUser(function(req, id, done) {

		var session = req.session;

		var cachedUser = uc.get(id);
		if (cachedUser){
			// console.log('-- cached user found: ' + id);
			done(null, cachedUser);
			return;
		}

		var userScheme = db.getObject('user', 'security');
		var roleScheme = db.getObject('role', 'security');
		userScheme
			.find(
			{
				where: { id: id },
				include: [{ model: roleScheme, as: 'roles' }]
			})
			.then(function(user){
				user.password = undefined;
				user.salt = undefined;
				uc.add(user);
				done(null, user);
			})
			.catch(function(err){
				done(err, null);
			});

	});

	// Initialize strategies
	config.getGlobbedFiles('./config/strategies/**/*.js').forEach(function(strategy) {
		require(path.resolve(strategy))();
	});
};