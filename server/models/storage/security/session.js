/**
 * Created by Andrey on 21.12.2014.
 */

"use strict";

function model(sequelize, DataTypes) {
    var Session =
        sequelize.define(
            "session",
            {
                id: { type: DataTypes.STRING(255), primaryKey: true, allowNull: false },
                data: { type: DataTypes.JSON },
                addressInitial: { type: DataTypes.STRING(256) },
                addressLast: { type: DataTypes.STRING(256), allowNull: true },
                created: { type: DataTypes.DATE },
                updated: { type: DataTypes.DATE, allowNull: true }
            },
            {
                // don't add the timestamp attributes (updatedAt, createdAt)
                timestamps: false,

                schema: "security",

                tableName: 'Sessions'
            }

        );

    return Session;
};


module.exports = {
    model: model
};
