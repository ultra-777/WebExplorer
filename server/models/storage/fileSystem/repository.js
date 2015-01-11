"use strict";

var fs = require('fs');
var config = require('../../../../config/config');

function model(sequelize, DataTypes) {

    var Repository =
        sequelize.define(
            "repository",
            {
                id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
                location: { type: DataTypes.STRING(2048) },
                isOpen: { type: DataTypes.BOOLEAN, defaultValue: false },
                childFilesLimit: { type: DataTypes.BIGINT, allowNull: false },
                childFoldersLimit: { type: DataTypes.BIGINT, allowNull: false },
                created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
            },
            {
                // don't add the timestamp attributes (updatedAt, createdAt)
                timestamps: false,

                schema: "fileSystem",

                // define the table's name
                tableName: 'Repositories'
            }
        );

    return Repository;
};

function exec(executeQueryHandler){

    var repositoryPath = config.repositoryPath;

    if (!repositoryPath)
        return;

    if (!fs.existsSync(repositoryPath))
        fs.mkdirSync(repositoryPath, '0600');

    if (!fs.existsSync(repositoryPath))
        return;

    var query =
        'insert into "fileSystem"."Repositories" ' +
        '("location", "isOpen", "childFilesLimit", "childFoldersLimit", "created") select'+
        '\'' +
        repositoryPath +
        '\'' +
        ', true,' +
        config.repositoryChildFilesLimit +
        ', ' +
        config.repositoryChildFoldersLimit +
        ', ' +
        'current_timestamp ' +
        'where not exists (select id from "fileSystem"."Repositories" limit 1);';

    executeQueryHandler(query)
        .error(function(err){
            console.error('Exception: %s (%s)', err.message, err.sql);
        });
}


module.exports = {
    model: model,
    exec: exec
};

