/**
 * Created by Andrey on 08.01.2015.
 */

"use strict";

function execute(executeQueryHandler, executeFileQueryHandler){
    executeFileQueryHandler(__dirname + '/roles.sql');
}

function init(executeQueryHandler, executeFileQueryHandler){
    executeQueryHandler('CREATE SCHEMA IF NOT EXISTS "security"');
}


module.exports = {
    exec: execute,
    init: init
};
