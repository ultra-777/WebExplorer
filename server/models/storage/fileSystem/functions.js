/**
 * Created by Andrey on 08.01.2015.
 */

"use strict";

function execute(executeQueryHandler, executeFileQueryHandler){
    executeFileQueryHandler(__dirname + '/addFile.sql');
    executeFileQueryHandler(__dirname + '/dropContainerNode.sql');
}


module.exports = {
    exec: execute
};
