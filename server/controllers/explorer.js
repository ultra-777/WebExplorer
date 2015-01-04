'use strict';

/**
 * Module dependencies.
 */

var fs = require('../models/fs.js');
var multiparty = require("multiparty");
var fss = require('fs');
var util = require('util');
var ms = require('memorystream');
var map = require('../models/map.js');
var db = require('../models/storage/db');
var config = require('../../config/config');



exports.index = function(req, res, next) {
    var result = {
      q: 25
    };
    res.jsonp(result);
};

exports.folder = function(req, res, next) {
    if (req.user) {
        var result = fs.GetItem(req.body.id);
        res.send(result.toJson());
    }
    else
        res.send(401, {
            message: 'User is not signed in'
        });
};

exports.root = function(req, res, next) {
    var result = fs.GetItem('.');
    res.send(result.toJson());
};

exports.newFolder = function(req, res, next) {
    var result = fs.NewFolder(req.body.id, req.body.name);
    res.send(result.toJson());
};

exports.delete = function(req, res, next) {
    var result = fs.Delete(req.body.id);
    res.jsonp(result);
};

exports.download = function(req, res, next) {
    fs.Download(req.query.id, res);
};

var _blobSchema = db.getObject('blob', 'fileSystem');
var _blobInstances = new Object();
process.on('message', function(msg){
    if (msg.cmd && msg.cmd == config.messageUpdateBlob){
        console.log('--node: %d. drop blob: %s', process.pid, msg.id);
        if (msg.id)
            delete _blobInstances[msg.id];
    }
});

exports.initBlob = function(req, res, next){

    var blobInstance = _blobSchema.build();
    blobInstance.file = req.body.fileName;
    blobInstance.folder = req.body.folderId;
    blobInstance.totalSize = req.body.totalSize;
    blobInstance.chunkSize = req.body.chunkSize;
    blobInstance.save()
        .then(function () {
            res.jsonp({ id: blobInstance.id });
        })
        .catch(function(err){
            res.send(500, err);
        });

};

exports.addBlobChunk = function(req, res, next){

    var cachedBlobInstance = _blobInstances[req.body.blobId];
    if (cachedBlobInstance){
        //console.log('--blob instance found: %s process: %d', req.body.blobId, process.pid);

        addChunk2Instance(
            cachedBlobInstance,
            req.body.chunkIndex,
            req.body.data,
            function(result){
                res.jsonp(result);
            });
    }
    else {
        //console.log('--blob instance not found: %s process: %d', req.body.blobId, process.pid);

        _blobSchema.find(req.body.blobId)
            .then(function (blobInstance) {

                if (blobInstance) {
                    _blobInstances[req.body.blobId] = blobInstance;

                    addChunk2Instance(
                        blobInstance,
                        req.body.chunkIndex,
                        req.body.data,
                        function(result){
                            res.jsonp(result);
                        });
                }
                else
                    res.jsonp({error: 'instance is absent'});

            })
            .catch(function (err) {
                res.send(500, err);
            });
    }
}

function addChunk2Instance(blobInstance, chunkIndex, data, callback){

    if (blobInstance) {
        blobInstance.addChunk(
            chunkIndex,
            data);

        var file =
            fs.GetItem(
                blobInstance.getRelativePath());

        var result =
        {
            id: blobInstance.id,
            percent: blobInstance.percent,
            isComplete: blobInstance.isOk,
            file: file
        };

        if (blobInstance.isOk) {
            dropBlob(blobInstance.id, function (state, error) {
                callback(result);
            });
            return;
        };
        callback(result);
    }
    else
        callback(null);
}

function dropBlob(id, callback){

    _blobSchema.find(id)
        .then(function (blobInstance) {
            if (blobInstance) {
                blobInstance.destroy()
                    .then(function (affectedRows) {
                        var existingInstance = _blobInstances[id];
                        if (existingInstance) {
                            existingInstance.release();
                            delete _blobInstances[id];
                            existingInstance = null;
                            callback && callback(true, null);
                            process.send && process.send({broadcast: true, cmd: config.messageUpdateBlob, id: id});
                        }
                        else
                            callback && callback(false, null);
                    })
                    .catch(function (err) {
                        callback && callback(false, err);
                    });
            }
            else
                callback && callback(false, null);
        })
        .catch(function (err) {
            callback && callback(false, err);
        });

}

exports.releaseBlob = function(req, res, next){

    dropBlob(req.body.blobId, function(result, error){
        res.jsonp(result);
    });
}

exports.uploadFile = function(req, res, next){

    var form = new multiparty.Form();

    // Errors may be emitted
    form.on('error', function(err) {
        console.log('Error parsing form: ' + err.stack);
    });

    var folderPath = null;
    var resultPath = null;

// Parts are emitted when parsing the form
    form.on('part', function(part) {
        if ((part.filename === undefined) || (part.filename === null)) {

            folderPath = map.pathToLocal(part.name);
            // filename is "null" when this is a field and not a file
            console.log('got field named ' + part.name);
            // ignore field's content
            part.resume();

        }
        else{
            console.log('got field named ' + part.name);
            // ignore file's content here

            if (folderPath !== null){
                var resultPathLocal = map.joinPath(folderPath, part.filename);
                resultPath = map.pathToRelative(resultPathLocal);
                var out = fss.createWriteStream(resultPathLocal);
                part.pipe(out);
            }
        }
    });

    form.on('close', function() {
        console.log('Upload completed!');

        var result = fs.GetItem(resultPath);

        res.jsonp(result);

    });
    form.parse(req);
}