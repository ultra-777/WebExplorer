'use strict';

/**
 * Module dependencies.
 */

var fs = require('../models/fs.js');
var bl = require('../models/blob.js');
var multiparty = require("multiparty");
var fss = require('fs');
var util = require('util');
var ms = require('memorystream');
var map = require('../models/map.js');


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