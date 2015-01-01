/**
 * Created by Andrey on 13.12.2014.
 */
"use strict";


var crypto = require('crypto');

function model(sequelize, DataTypes) {

    var User =
        sequelize.define(
            "user",
            {
                firstName: { type: DataTypes.STRING },
                lastName: { type: DataTypes.STRING },
                email: { type: DataTypes.STRING },
                username: { type: DataTypes.STRING, unique: true },
                password: { type: DataTypes.STRING },
                salt: { type: DataTypes.STRING },
                provider: { type: DataTypes.STRING },
                updated: { type: DataTypes.DATE },
                created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
            },
            {
                // don't add the timestamp attributes (updatedAt, createdAt)
                timestamps: false,

                schema: "security",

                // define the table's name
                tableName: 'Users',

                hooks: {
                    beforeUpdate: function (user, fn){
                        user.onBeforeUpdate(user, fn);
                    },
                    beforeCreate: function (user, fn){
                        user.onBeforeCreate(user, fn);
                    }
                },

                instanceMethods: {

                    onBeforeCreate: function (user, fn) {
                        if (user.password && user.password.length > 6) {
                            user.salt = crypto.randomBytes(16).toString('base64');
                            user.password = user.hashPassword(user.password);
                        }

                        return;
                    },

                    onBeforeUpdate: function (user, fn) {
                        if (user.password && user.password.length > 6) {
                            user.password = user.hashPassword(user.password);
                        }

                        return;
                    },

                    hashPassword: function (rawPassword) {
                        var result = rawPassword;
                        if (this.salt && rawPassword) {
                            result =
                                crypto.pbkdf2Sync(
                                    rawPassword,
                                    this.salt,
                                    10000,
                                    64).toString('base64');
                        }
                        console.log(" -- " + rawPassword + " + " + this.salt.toString('base64') + " = " + result );
                        return result;
                    },

                    authenticate: function(password) {
                        return this.password === this.hashPassword(password);
                    }
                }
            }
        );

    return User;
};

function configure(fabrique){
    var user = fabrique.getObject('user', 'security');
    var role = fabrique.getObject('role', 'security');
    user.belongsToMany(role, { as: {singular: 'role', plural: 'roles'}, through: 'UserRoles' });
    role.belongsToMany(user, { as: {singular: 'user', plural: 'users'}, through: 'UserRoles' });
}


module.exports = {
    model: model,
    config: configure
};

