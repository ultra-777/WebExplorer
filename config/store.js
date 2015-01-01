/**
 * Created by Andrey on 21.12.2014.
 */



var url = require('url'),
    db = require('../server/models/storage/db'),
    Session = require('express-session/session/session');


/**
 * Default options
 */

function optionsImpl(sourceOptions){
    var resultOptions = {
        defaultExpirationTime:  (sourceOptions && sourceOptions['defaultExpirationTime']) ? sourceOptions['defaultExpirationTime'] :  1000 * 60 * 5
        ,updateTimeout:  (sourceOptions && sourceOptions['updateTimeout']) ? sourceOptions['updateTimeout'] : 60 * 1000
    }
    return resultOptions;
};

var options = null;

function flatStringify(x, depth) {

    var dump = '';
    var isArray = Array.isArray(x);

    function dumpElement(currentDump, currentElementKey, currentElementValue, currentDepth){

        var currentType = typeof currentElementValue;
        if (currentElementValue instanceof Date)
            currentType = 'date';
        var currentPresentation = undefined;

        if (currentElementValue === null)
            currentPresentation = 'null';
        else {
            switch (currentType) {
                case 'object':
                    if (!currentDepth || currentDepth > 1)
                        currentPresentation =
                            flatStringify(
                                currentElementValue,
                                currentDepth ?
                                    (currentDepth - 1)
                                    : currentDepth);
                    break;
                case 'boolean':
                case 'number':
                    currentPresentation = JSON.stringify(currentElementValue);
                    break;
                case 'string':
                    currentPresentation = JSON.stringify(currentElementValue);
                    break;
                case 'date':
                    currentPresentation = '\"' + currentElementValue.toJSON() + '\"';
                    break;
                default:
                    break;
            }
        }

        if (currentPresentation !== undefined){
            if (!currentDump)
                currentDump = '';

            if (currentDump.length > 0)
                currentDump = currentDump + ',';

            if (!isArray)
                currentDump = currentDump + '\"' + currentElementKey + '\"' + ': ';
            currentDump = currentDump + currentPresentation;
        }

        return currentDump;
    };

    var index = 0;
    var idElement = x['id'];
    if (idElement)
        dump = dumpElement(dump, 'id', idElement, depth);
    for(var i in x) {
        dump = dumpElement(dump, i, x[i], depth);
    }

    if (dump === '')
        return null;

    if (isArray)
        return '[' + dump + ']';
    return '{' + dump + '}';
}



module.exports = function(connect) {
    var Store = connect.Store || connect.session.Store;
    var _sessions = new Object();
    options = new optionsImpl(connect.options);

    function getCachedSession(sid){

        var cachedSession = _sessions[sid];
        //console.log('-- store cached session: ' + sid + '  found: ' + (targetSession !== null));
        return cachedSession ? cachedSession : null;
    }

    function addCachedSession(session){
        if (!session)
            return;
        _sessions[session.id] = session;
        //console.log('-- store new cached session: ' + session.id + ' of ' + _sessions.length);
    }

    function dropCachedSession(sid){
        if (_sessions[sid])
            delete _sessions[sid];
        //console.log('-- store new cached session: ' + session.id + ' of ' + _sessions.length);
    }

    function updateSession(dbSession, session, callback) {

        var clientAddress = null;
        if (
            (session !== undefined)
            && (session !== null)
            && (session.req !== null)
        )
            clientAddress =
                (session.req.headers['x-forwarded-for'] || '').split(',')[0]
                || session.req.connection.remoteAddress;

        if (clientAddress !== null) {
            if ((dbSession.addressInitial === undefined) || (dbSession.addressInitial === null))
                dbSession.addressInitial = clientAddress;
            dbSession.addressLast = clientAddress;
        }

        var needFlush = checkIfUpdateRequired(dbSession, session);

        if (needFlush) {
            dbSession
                .save()
                .then(function () {
                    callback && callback(null);
                })
                .catch(function (err) {
                    callback && callback(err);
                });
        }
        else
            callback && callback(null, dbSession);
    }

    function checkIfUpdateRequired(dbSession, session){

        var needFlush = false;
        var today = new Date();


        if (session && session.cookie){
            var expiration = new Date(today.getTime() + options.defaultExpirationTime);
            session.cookie.expires = expiration;
        }

        if (!dbSession.created){
            needFlush = true;
            dbSession.created = today;
        }

        if (dbSession.updated){
            var diff = Math.abs(today - dbSession.updated);
            if (options.updateTimeout < diff)
                needFlush = true;
        }

        var newData = JSON.parse(flatStringify(session, 2));

        if (!needFlush){
            if (dbSession.data) {
                var newPassport = newData['passport'];
                var currentPassport = dbSession.data['passport'];
                if (newPassport && currentPassport){
                    if (newPassport['user'] != currentPassport['user'])
                        needFlush = true;
                }
                else if (!(!newPassport && !currentPassport))
                    needFlush = true;
            }
            else
                needFlush = true;
        }

        dbSession.data = newData;

        if (needFlush)
            dbSession.updated = today;

        return needFlush;
    }

    function loadSession(session, sid, destroy, callback){
        if (session) {
            var isDateOk = new Date() < new Date(session.data.cookie.expires);
            //console.log('-- load.session.isDateOk: ' + isDateOk + '(' + new Date() + ' / ' + new Date(session.data.cookie.expires) +  ')');
            if (!session.data.cookie.expires || Date.now() < new Date(session.data.cookie.expires)) {
                //console.log('-- load.session: ' + session.id + ' # ' + JSON.stringify(session.data))
                try {
                    callback(null, session.data);
                }
                catch(err){
                    var q = 0;
                }
            } else {
                destroy(sid, callback);
            }
        } else {
            callback && callback();
        }
    }

    /**
     * Initialize Impl with the given `options`.
     * Calls `callback` when db connection is ready (mainly for testing purposes).
     *
     * @param {Object} options
     * @param {Function} callback
     * @api public
     */

    function Impl() {
        this.defaultExpirationTime = options.defaultExpirationTime;
    };

    Impl.prototype.__proto__ = Store.prototype;

    /**
     * Attempt to fetch session by the given `sid`.
     *
     * @param {String} sid
     * @param {Function} callback
     * @api public
     */

    Impl.prototype.get = function(sid, callback) {

        var targetSession = getCachedSession(sid);
        if (targetSession !== null)
            loadSession(targetSession, sid, this.destroy, callback);
        else {

            var schemaSession = db.getObject('session', 'security');
            schemaSession.find(
                {
                    where: {id: sid}
                })
                .then(function (session) {
                    loadSession(session, sid, this.destroy, callback);
                })
                .catch(function (err) {
                    callback && callback(err, null);
                });
        }

        console.log('-- store get: ' + sid);
    };

    /**
     * Commit the given `sess` object associated with the given `sid`.
     *
     * @param {String} sid
     * @param {Session} session
     * @param {Function} callback
     * @api public
     */

    Impl.prototype.set = function(sid, session, callback) {

        var cachedSession = getCachedSession(sid);
        if (cachedSession !== null) {
            updateSession(cachedSession, session, callback);
        }
        else {
            var schemaSession = db.getObject('session', 'security');

            schemaSession.find(
                {
                    where: {id: sid}
                })
                .then(function (targetSession) {
                    if (!targetSession) {
                        targetSession = schemaSession.build();
                        targetSession.id = sid;
                    }
                    addCachedSession(targetSession);
                    updateSession(targetSession, session, callback);
                })
                .catch(function (err) {
                    callback && callback(err);
                });
        }

        console.log('-- store set: ' + sid);
};

    /**
     * Destroy the session associated with the given `sid`.
     *
     * @param {String} sid
     * @param {Function} callback
     * @api public
     */

    Impl.prototype.destroy = function(sid, callback) {
        var schemaSession = db.getObject('session', 'security');
        schemaSession.destroy(
            {id: sid},
            {truncate: true}
        )
        .then(function(affectedRows){
            dropCachedSession(sid);
            callback && callback();
        })
        .catch(function(err){
            callback && callback(err);
        })
        console.log('-- store destroy: ' + sid);
    };

    /**
     * Fetch number of sessions.
     *
     * @param {Function} callback
     * @api public
     */

    Impl.prototype.length = function(callback) {
        var schemaSession = db.getObject('session', 'security');

        schemaSession
            .count()
            .then(function(count) {
                callback && callback(null, count);
                console.log('-- store length: ' + count);
            })
            .catch(function(err){
                callback && callback(err);
                console.log('-- store length: ' + err);
            });
    };

    /**
     * Clear all sessions.
     *
     * @param {Function} callback
     * @api public
     */

    Impl.prototype.clear = function(callback) {
        var schemaSession = db.getObject('session', 'security');
        schemaSession.destroy(
            {},
            {truncate: true}
        )
            .then(function(affectedRows){
                callback && callback();
            })
            .catch(function(err){
                callback && callback(err);
            })
        console.log('-- store clear: ');
    };

    return Impl;
};

