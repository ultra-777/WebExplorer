/**
 * Created by Andrey on 08.01.2015.
 */

"use strict";

function execute(executeQueryHandler, executeFileQueryHandler){
    executeQueryHandler('CREATE SCHEMA IF NOT EXISTS "security"');
    executeFileQueryHandler(__dirname + '/roles.sql');
}


module.exports = {
    exec: execute
};
