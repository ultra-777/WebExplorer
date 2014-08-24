'use strict';

/**
 * Module dependencies.
 */


var map = require('./map.js');
var fs = require('fs');
var uuid = require('node-uuid');



function blob(folderPath, name, totalSize, chunkSize){

    function chunkInfo(){
        this.start = 0;
        this.size = 0;
        this.isOk = false;
    }

    this.id = uuid.v1();
    this._name = name;
    this._totalSize = totalSize;
    this._chunkSize = chunkSize;
    this._folder = map.pathToLocal(folderPath);
    this._filePath = map.joinPath(this._folder, name);
    this._stream = fs.openSync(this._filePath, 'w');
    this._data = [];


    var index = -1;
    var left = totalSize;
    var start = 0;
    do {
        var chunk = new chunkInfo();
        index = index + 1;
        this._data.splice(index, 0, chunk);
        chunk.start = start;
        chunk.size = (left > chunkSize) ? chunkSize : left;
        start = start + chunkSize;
        left = left - chunkSize;
    } while (left > 0)

    this.addChunk = function(chunkIndex, data){
        var binaryData = new Buffer(data, 'base64');
        var existingChunk = this._data[chunkIndex];
        fs.writeSync(this._stream, binaryData, 0, existingChunk.size, existingChunk.start)
        existingChunk.isOk = true;
    }

    this.percent = function(){

        var totalCount = this._data.length;
        if (totalCount < 1)
            return 0;
        var ok = 0;
        for (var i = 0; i < totalCount; i++){
            var chunk = this._data[i];
            if (chunk.isOk)
                ok = ok + 1;
        }

        return ok / totalCount;
    }

    this.isOk = function(){
        var totalCount = this._data.length;
        for (var i = 0; i < totalCount; i++){
            var chunk = this._data[i];
            if (!chunk.isOk)
                return false;
        }
        return true;
    }

    this.flush = function(){
        if (this._stream != null) {
            fs.fsyncSync(this._stream);
            fs.close(this._stream);
            this._stream = null;
        }
    }

    this.filePath = function(){
        if (this.isOk()){
            return map.pathToRelative(this._filePath);
        }
        return null;
    }

    this.dispose = function(){
        var isOk = this.isOk();
        this.flush();
        if (!isOk)
            fs.unlink(this._filePath);
    }
}



// export the class

module.exports.Blob = blob;



