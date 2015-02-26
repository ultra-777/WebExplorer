/**
 * Created by Andrey on 23.02.2015.
 */

"use strict";

function execute(executeQueryHandler, executeFileQueryHandler){
    executeFileQueryHandler(__dirname + '/addFile.sql');
    executeFileQueryHandler(__dirname + '/dropContainerNode.sql');
}

function init(executeQueryHandler, executeFileQueryHandler){
    executeQueryHandler('CREATE SCHEMA IF NOT EXISTS "fileSystem"');
}


module.exports = {
    exec: execute,
    init: init
};
