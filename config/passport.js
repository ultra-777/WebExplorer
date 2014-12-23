'use strict';

var passport = require('passport'),
	db = require('../server/models/storage/db'),
	path = require('path'),
	config = require('./config');

module.exports = function() {
	// Serialize sessions
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	// Deserialize sessions
	passport.deserializeUser(function(id, done) {

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