/**
 * Created by Andrey on 13.12.2014.
 */
"use strict";

function model(sequelize, DataTypes) {
    var definition =
        sequelize.define(
            "role",
            {
                name: { type: DataTypes.STRING, unique: true }
            },
            {
                // don't add the timestamp attributes (updatedAt, createdAt)
                timestamps: false,

                schema: "security",

                // define the table's name
                tableName: 'Roles'
            }
        );
    return definition;
};


module.exports = {
    model: model
};


