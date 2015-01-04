"use strict";

var fs = require('fs');
var uuid = require('node-uuid');
var map = require('../../map');

function model(sequelize, DataTypes) {

    var Blob =
        sequelize.define(
            "blob",
            {
                id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
                folder: { type: DataTypes.STRING(2048) },
                file: { type: DataTypes.STRING(256) },
                totalSize: { type: DataTypes.BIGINT },
                chunkSize: { type: DataTypes.BIGINT },
                created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
            },
            {
                // don't add the timestamp attributes (updatedAt, createdAt)
                timestamps: false,

                schema: "fileSystem",

                // define the table's name
                tableName: 'Blob',

                hooks: {
                    beforeUpdate: function (blob, fn){
                        blob.onBeforeUpdate(blob, fn);
                    },
                    beforeCreate: function (blob, fn){
                        blob.onBeforeCreate(blob, fn);
                    },
                    beforeSave: function (blob, fn){
                        blob.onBeforeSave(blob, fn);
                    }
                },

                instanceMethods: {

                    onBeforeCreate: function (blob, fn) {
                        return;
                    },

                    onBeforeUpdate: function (blob, fn) {
                        return;
                    },

                    onBeforeSave: function (blob, fn) {
                        return;
                    },

                    getRelativePath: function(){
                        if (this.isOk){
                            return map.pathToRelative(this.getFilePath());
                        }
                        return null;
                    },

                    addChunk: function(index, data){
                        var binaryData = new Buffer(data, 'base64');
                        var startPosition = Number(this.chunkSize) * index;
                        var size = Number(this.chunkSize);
                        var expectedPosition = startPosition + size;
                        if (expectedPosition > this.totalSize){
                            size = this.totalSize - startPosition;
                            expectedPosition = startPosition + size;
                            if (size < 1)
                            return;
                        }

                        if (!this.fileStream){
                            this.fileStream = fs.openSync(this.getFilePath(), 'a');
                        }

                        fs.writeSync(this.fileStream, binaryData, 0, size, startPosition);
                        //fs.fsyncSync(this.fileStream);

                        this.percent = expectedPosition / this.totalSize;

                        if (expectedPosition >= this.totalSize){
                            this.isOk = true;
                            this.percent = 1.0;
                            this.flush();
                        }
                    },

                    flush: function(){
                        if (this.fileStream != null) {
                            fs.fsyncSync(this.fileStream);
                            fs.closeSync(this.fileStream);
                            this.fileStream = null;
                        }
                    },

                    getFilePath: function(){
                        var folderPath = map.pathToLocal(this.folder);
                        var filePath = map.joinPath(folderPath, this.file);
                        return filePath;
                    },

                    release: function(){
                        this.flush();
                        if (!this.isOk)
                            fs.unlink(this.getFilePath());
                    },

                    fileStream: null,

                    percent: 0.0,

                    isOk: false
                },

                setterMethods   : {
                    totalSize : function(newValue) {
                        this.setDataValue('totalSize', Number(newValue));
                    },
                    chunkSize : function(newValue) {
                        this.setDataValue('chunkSize', Number(newValue));
                    }
                }


            }
        );

    return Blob;
};


module.exports = {
    model: model
};

