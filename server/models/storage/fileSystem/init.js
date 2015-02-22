/**
 * Created by Andrey on 23.02.2015.
 */

"use strict";

function execute(executeQueryHandler, executeFileQueryHandler){
    executeQueryHandler('CREATE SCHEMA IF NOT EXISTS "fileSystem"');
    executeFileQueryHandler(__dirname + '/addFile.sql');
    executeFileQueryHandler(__dirname + '/dropContainerNode.sql');
}


module.exports = {
    exec: execute
};
