'use strict';

/**
 * Module dependencies.
 */

var toString = require('../common/stringify');


function JsonImpl() {
    this.toJson = function() {

        return toString(this);

    };
}

module.exports.JsonImpl = JsonImpl;

