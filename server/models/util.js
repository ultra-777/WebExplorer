'use strict';

/**
 * Module dependencies.
 */

function flatStringify(x) {
    for(var i in x) {
        if(!x.hasOwnProperty(i)) {
            // weird as it might seem, this actually does the trick! - adds parent property to self
            x[i] = x[i];
        }
    }
    return JSON.stringify(x);
}

function flatStringify2(x) {

    var dump = '';
    var isArray = Array.isArray(x);

    var index = 0;
    for(var i in x) {

        var currentElement = x[i];
        var currentType = typeof currentElement;
        var currentPresentation = undefined;

        if (currentElement === null)
            currentPresentation = 'null';
        else {
            switch (currentType) {
                case 'object':
                    currentPresentation = flatStringify2(currentElement);
                    break;
                case 'boolean':
                case 'number':
                    currentPresentation = JSON.stringify(currentElement);
                    break;
                case 'string':
                    currentPresentation = JSON.stringify(currentElement);
                    break;
                default:
                    break;
            }
        }

        if (currentPresentation !== undefined){
            if (index > 0)
                dump = dump + ',';

            if (!isArray)
                dump = dump + '\"' + i + '\"' + ': ';
            dump = dump + currentPresentation;
            index = index + 1;
        }
    }

    if (dump === '')
        return null;

    if (isArray)
        return '[' + dump + ']';
    return '{' + dump + '}';
    //return JSON.stringify(x);
}


function JsonImpl() {
    this.toJson = function() {

        return flatStringify2(this);

        for(var i in this) {
            if(!this.hasOwnProperty(i)) {
                // weird as it might seem, this actually does the trick! - adds parent property to self
                this[i] = this[i];
            }
        }

        return JSON.stringify(this, null, '\t');
    };
}

module.exports.JsonImpl = JsonImpl;

