'use strict';

/**
 * Module dependencies.
 */

var util = require('./util.server.model.js');

var rootFolderAlias = '$';

function itemIndex() {
    // always initialize all instance properties
    /*jshint validthis:true */
    this.Id = '';
}

itemIndex.prototype = new util.JsonImpl();

function item() {
    // always initialize all instance properties
    /*jshint validthis:true */
    this.IsContainer = false;
    /*jshint validthis:true */
    this.Name = '';
    /*jshint validthis:true */
    this.Parent = '';
}

item.prototype = new itemIndex();

function folder() {
    /*jshint validthis:true */
    this.IsContainer = true;
    /*jshint validthis:true */
    this.Children = [];
}
folder.prototype = new item();


function file() {
    /*jshint validthis:true */
    this.Size = 0;
}

file.prototype = new item();

// export the class
module.exports.Folder = folder;

module.exports.File = file;

module.exports.RootAlias = rootFolderAlias;

