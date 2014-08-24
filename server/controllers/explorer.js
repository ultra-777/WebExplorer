'use strict';

/**
 * Module dependencies.
 */

var fs = require('../models/fs.js');
var bl = require('../models/blob.js');

exports.index = function(req, res, next) {
    var result = {
      q: 25
    };
    res.jsonp(result);
};

exports.folder = function(req, res, next) {
    var result = fs.GetItem(req.body.id);
    res.send(result.toJson());
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

var _blobs = {};

exports.initBlob = function(req, res, next){
    var newBlob =
        new bl.Blob(
            req.body.folderId,
            req.body.fileName,
            req.body.totalSize,
            req.body.chunkSize);
    _blobs[newBlob.id] = newBlob;
     res.jsonp({ id: newBlob.id });
};

exports.addBlobChunk = function(req, res, next){
    var blob = _blobs[req.body.blobId]
    blob.addChunk(
        req.body.chunkIndex,
        req.body.data);

    var file = fs.GetItem(blob.filePath());

    var result =
        {
            id: blob.id,
            percent: blob.percent(),
            isComplete: blob.isOk(),
            file: file
        };

    if (blob.isOk()){
        delete _blobs[blob.Id];
        blob.dispose();
        blob = null;
    };
    res.jsonp(result);
}

exports.releaseBlob = function(req, res, next){
    var blob = _blobs[req.body.blobId];
    if (blob) {
        delete _blobs[blob.Id];
        blob.dispose();
        blob = null;
        res.jsonp(true);
    }
    else
        res.jsonp(false);
}