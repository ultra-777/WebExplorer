/**
 * Created by Andrey on 13.12.2014.
 */
"use strict";

var
    Sequelize = require('sequelize'),
    path = require('path'),
    pg = require('pg').native,
    config = require('../../../config/config');

var _sequelize = null;
var _objects = [];

function initSequelize(uri){
    _sequelize =
        new Sequelize(
            uri,
            {
                pool: true
            }
        );

    console.log('-- sequelize init started');
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
                        _objects.push(schemaObject)
                    console.log('-- model: ' + resolvedPath);
                }

                var config = reference.config;
                if ((config !== undefined) && (config !== null)) {
                    configuration.push(config)
                    console.log('-- config: ' + resolvedPath);
                }
            }
        }
    });


    var configCount = configuration.length;
     for (var i = 0; i < configCount; i++){
        var configure = configuration[i];
        if ((configure !== undefined) && (configure !== null)){
            configure(this);
        }
    }
    console.log('-- sequelize init complete');
    return _sequelize.sync();
}

function getObject(objectName, schemaName){
    var totalCount = _objects.length;
    for (var i = 0; i < totalCount; i++){
        var object = _objects[i];
        if ((schemaName !== undefined) && (schemaName !== null)){
            if (object.options.schema !== schemaName)
                continue;
        }
        if (object.name === objectName)
            return object;
    }
    return null;
}

module.exports = {
    init: initSequelize,
    getObject: getObject,
    Sequelize: Sequelize
};

