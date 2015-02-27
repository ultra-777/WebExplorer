'use strict';

/**
 * Module dependencies.
 */

var multiparty = require("multiparty");
var fs = require('fs');
var db = require('../models/storage/db');
var config = require('../../config/config');
var treeImpl = require('../models/tree');

var _blobSchema = db.getObject('blob', 'fileSystem');
var _blobInstances = new Object();
process.on('message', function(msg){
    if (msg.cmd && msg.cmd == config.messageUpdateBlob){
        console.log('--node: %d. drop blob: %s', process.pid, msg.id);
        if (msg.id)
            delete _blobInstances[msg.id];
    }
});

exports.folder = function(req, res, next) {

    checkAuthorization(req, res, function(){
        treeImpl.getInstance(null, req.user, function(instance, error){
            if (error)
                res.send(500, error);
            else{
                instance.getFolder(req.body.id, function(folder, error){
                    if (error)
                        res.send(500, error);
                    else
                        res.send(folder.toJson());
                });
            }
        })
    });
};

exports.root = function(req, res, next) {
    checkAuthorization(req, res, function(){
        treeImpl.getInstance(null, req.user, function(instance, error){
            if (error)
                res.send(500, error);
            else{
                instance.getRoot(function(folder, error){
                    if (error)
                        res.send(500, error);
                    else
                        res.send(folder.toJson());
                });
            }
        })
    });
};

exports.newFolder = function(req, res, next) {
    checkAuthorization(req, res, function(){
        treeImpl.getInstance(null, req.user, function(instance, error){
            if (error)
                res.send(500, error);
            else{
                instance.newFolder(req.body.id, req.body.name, function(folder, error){
                    if (error)
                        res.send(500, error);
                    else
                        res.send(folder.toJson());
                });
            }
        })
    });
};

exports.delete = function(req, res, next) {
    checkAuthorization(req, res, function(){
        treeImpl.getInstance(null, req.user, function(instance, error){
            if (error)
                res.send(500, error);
            else{
                instance.dropNode(req.body.id, function(result, error){
                    if (error)
                        res.send(500, error);
                    else{
                        res.jsonp(result);
                    }
                });
            }
        })
    });
};

exports.rename = function(req, res, next) {
    checkAuthorization(req, res, function(){
        treeImpl.getInstance(null, req.user, function(instance, error){
            if (error)
                res.send(500, error);
            else{
                instance.rename(req.body.id, req.body.newName, function(result, error){
                    if (error)
                        res.send(500, error);
                    else{
                        res.jsonp(result);
                    }
                });
            }
        })
    });
};

exports.download = function(req, res, next) {
    checkAuthorization(req, res, function(){
        treeImpl.getInstance(null, req.user, function(instance, error){
            if (error)
                res.send(500, error);
            else{
                instance.downloadFile(req.query.id, function(fileName, stream, error){
                    if (error)
                        res.send(500, error);
                    else{
                        res.setHeader('Content-disposition', 'attachment; filename=' + fileName);
                        res.setHeader('Content-type', 'application/octet-stream');
                        stream.pipe(res);
                    }
                });
            }
        })
    });
};

exports.initBlob = function(req, res, next){
    checkAuthorization(req, res, function(){
        _blobSchema
            .create(
                req.body.fileName,
                req.body.folderId,
                req.body.totalSize,
                req.body.chunkSize,
                req.user,
                function(blob, err){
                    if (err)
                        res.send(500, err);
                    else{
                        if (blob)
                            res.jsonp({ id: blob.id });
                        else
                            res.jsonp({ id: null });
                    }
                });
    });
};

exports.addBlobChunk = function(req, res, next){
    checkAuthorization(req, res, function(){
        var cachedBlobInstance = _blobInstances[req.body.blobId];
        if (cachedBlobInstance){
            //console.log('--blob instance found: %s process: %d', req.body.blobId, process.pid);
            if (cachedBlobInstance.containerNode.tree.owner.id === req.user.id) {
                addChunk2Instance(
                    cachedBlobInstance,
                    req.body.chunkIndex,
                    req.body.data,
                    function (result) {
                        res.jsonp(result);
                    });
            }
            else
                res.send(404, 'instance is absent');
        }
        else {
            //console.log('--blob instance not found: %s process: %d', req.body.blobId, process.pid);

            _blobSchema
                .get(
                    req.body.blobId,
                    null,
                    function(blobInstance, err) {
                        if (err)
                            res.send(500, err);
                        else {
                            if (blobInstance) {

                                if (blobInstance.containerNode.tree.owner.id === req.user.id) {

                                    _blobInstances[req.body.blobId] = blobInstance;

                                    addChunk2Instance(
                                        blobInstance,
                                        req.body.chunkIndex,
                                        req.body.data,
                                        function (result) {
                                            res.jsonp(result);
                                        });
                                }
                                else
                                    res.send(404, 'instance is absent');
                            }
                            else
                                res.send(404, 'instance is absent');
                    }
                });
        }
    });
}

function addChunk2Instance(blobInstance, chunkIndex, data, callback){

    if (blobInstance) {
        blobInstance.addChunk(
            chunkIndex,
            data);

        var result =
        {
            id: blobInstance.id,
            percent: blobInstance.percent,
            isComplete: blobInstance.isOk
        };

        if (blobInstance.isOk) {

            dropBlob(blobInstance.id, function (newNode, error) {

                if (newNode)
                    result.file = treeImpl.getFileInfo(newNode);

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

    var existingInstance = _blobInstances[id];
    if (existingInstance) {
        delete _blobInstances[id];
    }

    var handler = function(newNode, err) {
        if (err)
            callback && callback(null, err);
        else {
            callback && callback(newNode, null);
            process.send && process.send({
                broadcast: true,
                cmd: config.messageUpdateBlob,
                id: id
            });
        }
    };

    if (existingInstance)
        _blobSchema.dropInstance(existingInstance, handler);
    else
        _blobSchema.dropById(id, handler);

    existingInstance = null;
}

exports.releaseBlob = function(req, res, next){
    checkAuthorization(req, res, function() {

        _blobSchema
            .get(
            req.body.blobId,
            null,
            function (blobInstance, err) {
                if (err)
                    res.send(500, err);
                else {
                    if (blobInstance) {

                        if (blobInstance.containerNode.tree.owner.id === req.user.id) {
                            dropBlob(req.body.blobId, function (result, err) {
                                res.jsonp(result);
                            });
                        }
                        else
                            res.send(404, 'instance is absent');
                    }
                }
            });
    })
}

exports.uploadFile = function(req, res, next){

    var form = new multiparty.Form();

    var dataLength = null;
    var parentNodeId = null;
    var repositoryBlob = null;

// Parts are emitted when parsing the form
    form.on('part', function(part) {
        if ((part.filename === undefined) || (part.filename === null)) {

            parentNodeId = Number(part.name);
            part.resume();
        }
        else{
            console.log('got field named ' + part.name);
            // ignore file's content here

            var nodeSchema = db.getObject('node', 'fileSystem');
            nodeSchema
                .get(parentNodeId, null, function(parentNode, err){
                    if (err)
                        res.send(500, err);
                    else{
                        if (parentNode){
                            dataLength = part.byteCount;
                            _blobSchema
                                .create(
                                    part.filename,
                                    parentNode.id,
                                    part.byteCount,
                                    part.byteCount,
                                    req.user,
                                    function(blob, err){
                                        if (err)
                                            res.send(500, err);
                                        else{
                                            repositoryBlob = blob;
                                            repositoryBlob.containerNode = parentNode;
                                            var location = blob.file.getLocation();
                                            var out = fs.createWriteStream(location);
                                            part.pipe(out);
                                        }
                                    });
                        }
                    }
                });
            }
    });

    form.on('error', function(err) {
        console.log('Upload error!' + err);

        release();

        res.send(200)

    });

    form.on('aborted', function() {
        console.log('Upload aborted!');

        release();

        res.send(200);

    });

    form.on('close', function() {
        console.log('Upload completed!');
        repositoryBlob.isOk = true;
        release(res);
    });

    function release(res){
        if (repositoryBlob) {
            _blobSchema
                .dropInstance(repositoryBlob, function (newNode, err) {
                    if (res) {
                        if (err)
                            res.send(500, err);
                        else
                            res.jsonp(treeImpl.getFileInfo(newNode));
                    }
                    repositoryBlob = null;
                });
        }
    }

    form.parse(req);
}

function checkAuthorization(req, res, callback/*function()*/){
    if (req.user) {
        callback && callback();
    }
    else {
        res.send(401, {
            message: 'User is not signed in'
        });
    }
}
