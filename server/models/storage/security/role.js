/**
 * Created by Andrey on 13.12.2014.
 */
"use strict";

function model(sequelize, DataTypes) {
    var Role =
        sequelize.define(
            "role",
            {
                name: { type: DataTypes.STRING }
            },
            {
                // don't add the timestamp attributes (updatedAt, createdAt)
                timestamps: false,

                schema: "security",

                // define the table's name
                tableName: 'Roles'
            }

    );

    //Role.hasMany(User, { as: 'Users', through: 'user_roles' });
    return Role;
};


module.exports = {
    model: model
};


