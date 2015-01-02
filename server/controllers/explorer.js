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
        console.log('--blob instance found: %s process: %d', req.body.blobId, process.pid);

        addChunk2Instance(
            cachedBlobInstance,
            req.body.chunkIndex,
            req.body.data,
            function(result){
                res.jsonp(result);
            });
    }
    else {
        console.log('--blob instance not found: %s process: %d', req.body.blobId, process.pid);

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

// Close emitted after form parsed
    form.on('close', function() {
        console.log('Upload completed!');

        var result = fs.GetItem(resultPath);

        res.jsonp(result);

    });


    form.parse(req);



    /*
    form.parse(req, function(err, fields, files) {
        res.writeHead(200, {'content-type': 'text/plain'});
        res.write('received upload:\n\n');
        res.end(util.inspect({fields: fields, files: files}));
    });
    */

/*

    // parsing
    var parser = multipart.parser();

// in all event handlers, "this" is the parser, and "this.part" is the
// part that's currently being dealt with.
    parser.onpartbegin = function (part) {
        var q = 0;
    };
    parser.ondata = function (chunk) {
        var q = 0;
    };
    parser.onend = function () {
        var q = 0;
    };

// now start feeding the message through it.
// you can do this all in one go, if you like, or one byte at a time,
// or anything in between.
    parser.boundary = "xxxxxxxxx";
    var chunk;
    while ( chunk = upstreamThing.getNextChunk() ) {
        parser.write(chunk);
    }
    parser.close();






    // Handle request as multipart
    var stream = new multipart.Stream(req);

    // Create promise that will be used to emit event on file close
    var closePromise = new events.Promise();

    // Add handler for a request part received
    stream.addListener("part", function(part) {
        sys.debug("Received part, name = " + part.name + ", filename = " + part.filename);

        var openPromise = null;

        // Add handler for a request part body chunk received
        part.addListener("body", function(chunk) {
            // Calculate upload progress
            var progress = (stream.bytesReceived / stream.bytesTotal * 100).toFixed(2);
            var mb = (stream.bytesTotal / 1024 / 1024).toFixed(1);

            sys.debug("Uploading " + mb + "mb (" + progress + "%)");

            // Ask to open/create file (if not asked before)
            if (openPromise == null) {
                sys.debug("Opening file");
                openPromise = posix.open("./uploads/" + part.filename, process.O_CREAT | process.O_WRONLY, '0600');
            }

            // Add callback to execute after file is opened
            // If file is already open it is executed immediately
            openPromise.addCallback(function(fileDescriptor) {
                // Write chunk to file
                write_chunk(req, fileDescriptor, chunk,
                    (stream.bytesReceived == stream.bytesTotal), closePromise);
            });

        });
    });

    // Add handler for the request being completed
    stream.addListener("complete", function() {
        sys.debug("Request complete");

        // Wait until file is closed
        closePromise.addCallback(function() {
            // Render response
            res.sendHeader(200, {"Content-Type": "text/plain"});
            res.sendBody("Thanks for playing!");
            res.finish();

            sys.puts("\n=> Done");
        });
    });
*/
}