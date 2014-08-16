'use strict';

/**
 * Module dependencies.
 */


var fs = require('fs');
var exp = require('./explorer.server.model.js');
var map = require('./map.server.model.js');



function getFile(path, stat){

    var fileName = map.getFileName(path);

    var result = new exp.File();
    result.Id = map.pathToRelative(path);
    result.Parent = map.getParent(path);
    result.Name = fileName;
    result.Size = stat.size;

    return result;
}

function getFolder(path, withChildren) {

    var relativePath = map.pathToRelative(path);
    var folderName = map.getFileName(relativePath);

    var result = new exp.Folder();
    result.Name = folderName;
    result.Id = relativePath;
    result.Parent = map.getParent(path);

    if (withChildren === true) {
        var dirContents = fs.readdirSync(path);

        for (var itemIndex in dirContents) {
            var item = dirContents[itemIndex];
            var itemPath = map.joinPath(path, item);
            if (fs.existsSync(itemPath)) {
                var stat = fs.statSync(itemPath);
                if (stat.isDirectory()) { //conditing for identifying folders
                    result.Children.push(getFolder(itemPath, false));
                }
                else {
                    result.Children.push(getFile(itemPath, stat));
                }
            }
        }
    }
    return result;
}

function getItem(pathCandidate) {

    var path = map.pathToLocal(pathCandidate);

    if (fs.existsSync(path)){
        var stat = fs.statSync(path);
        if (stat.isDirectory()){
            return getFolder(path, true);
        }
        else{
            return getFile(path, stat);
        }
    }
    return null;
}

function newFolder(parentFolderId, name)
{
    var path = map.pathToLocal(parentFolderId);
    if (fs.existsSync(path)) {
        var newPath = map.joinPath(path, name);
        if (!fs.existsSync(newPath)) {
            fs.mkdirSync(newPath, '0600');
            return getFolder(newPath, true);
        }
    }
    return null;
}

function deleteItem(path)
{
    var path = map.pathToLocal(path);
    if (fs.existsSync(path)) {
        var stat = fs.statSync(path);
        if (stat.isDirectory()){
            fs.rmdirSync(path);
        }
        else{
            fs.unlink(path);
        }
        return true;
    }
    return false;
}

function downloadFile(path, res){
    path = map.pathToLocal(path);

    var filename = map.getFileName(path);

    res.setHeader('Content-disposition', 'attachment; filename=' + filename);
    res.setHeader('Content-type', 'application/octet-stream');

    var fileStream = fs.createReadStream(path);
    fileStream.pipe(res);
}

// export the class

module.exports.GetItem = getItem;

module.exports.NewFolder = newFolder;

module.exports.Delete = deleteItem;

module.exports.Download = downloadFile;




