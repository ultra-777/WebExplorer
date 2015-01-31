/**
 * Created by Andrey on 08.01.2015.
 */

"use strict";

function execute(executeQueryHandler, executeFileQueryHandler){
    executeFileQueryHandler(__dirname + '/roles.sql');
}


module.exports = {
    exec: execute
};
