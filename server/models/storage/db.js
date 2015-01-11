/**
 * Created by Andrey on 13.12.2014.
 */
"use strict";


var
    Sequelize = require('sequelize'),
    fs = require('fs'),
    path = require('path'),
    pg = require('pg').native,
    config = require('../../../config/config');

var _sequelize = null;

function initSequelize(uri){
    _sequelize =
        new Sequelize(
            uri,
            {
                pool: true
            }
        );

    //console.log('-- sequelize init started');
    var currentFileName = __filename;
    var configuration = [];
    config.getGlobbedFiles(__dirname + '/**/*.js').forEach(function(item) {
        var resolvedPath = path.resolve(item);
        if (currentFileName !== resolvedPath){
            var reference = require(resolvedPath);
            if ((reference !== undefined) && (reference !== null)){
                var model = reference.model;
                if ((model !== undefined) && (model !== null)) {
                    var schemaObject = model(_sequelize, Sequelize);
                    //schemaObject.name = schemaObject
                    if ((schemaObject.options) && (schemaObject.options.schema))
                        schemaObject.name = schemaObject.options.schema + '.' + schemaObject.name;
                    //console.log('-- model: ' + resolvedPath);
                }

                var config = reference.config;
                if ((config !== undefined) && (config !== null)) {
                    configuration.push(config)
                    //console.log('-- config: ' + resolvedPath);
                }

            }
        }
    });


    var configCount = configuration.length;
     for (var i = 0; i < configCount; i++){
        var configure = configuration[i];
        if ((configure !== undefined) && (configure !== null)){
            configure(getObject);
        }
    }

    configuration = null;
}

function initSequelizeAndSynq(uri){
    initSequelize(uri);
    var promise = _sequelize.sync();
    promise.then(function(){
        var currentFileName = __filename;
        var execute = [];
        config.getGlobbedFiles(__dirname + '/**/*.js').forEach(function(item) {
            var resolvedPath = path.resolve(item);
            if (currentFileName !== resolvedPath) {
                var reference = require(resolvedPath);
                if ((reference !== undefined) && (reference !== null)) {

                    var exec = reference.exec;
                    if ((exec !== undefined) && (exec !== null)) {
                        execute.push(exec)
                        //console.log('-- exec: ' + resolvedPath);
                    }
                }
            }
        });
        var execCount = execute.length;
        for (var i = 0; i < execCount; i++){
            var exec = execute[i];
            if ((exec !== undefined) && (exec !== null)){
                exec(executeQuery, executeFileQuery);
            }
        }
    })
    return promise;
}

function getObject(objectName, schemaName){

    var name = schemaName ? (schemaName + '.' + objectName) : objectName;
    return _sequelize.model(name);
}

function executeQuery(query){
    return _sequelize.query(query);
}

function executeFileQuery(filePath){
    var fileContents = fs.readFileSync(filePath, "utf8");
    return executeQuery(fileContents);
}

function buildPath(nodeId, parentPath, repositoryLocation, isContainer, extension){
    var realFolderPath = '';
    if (parentPath) {
        var parentPathParts = parentPath.split('.');
        for (var p = 0; p < parentPathParts.length; p++) {
            realFolderPath += path.sep;
            realFolderPath += parentPathParts[p];
        }
    }
    if (realFolderPath.length > 0)
        realFolderPath += path.sep;
    if (nodeId) {
        realFolderPath += nodeId;
        if ((!isContainer) && extension)
            realFolderPath += ('.' + extension);
    }
    var result =
        repositoryLocation ?
            path.join(repositoryLocation, realFolderPath)
            : realFolderPath;
    return result;
}

module.exports = {
    init: initSequelize,
    initAndSynq: initSequelizeAndSynq,
    getObject: getObject,
    Sequelize: Sequelize,
    buildPath: buildPath
};

