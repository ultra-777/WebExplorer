/**
 * Created by Andrey on 21.12.2014.
 */



var url = require('url'),
    db = require('../server/models/storage/db');


/**
 * Default options
 */

var defaultOptions = {host: '127.0.0.1',
    port: 27017,
    stringify: true,
    collection: 'sessions',
    auto_reconnect: false,
    ssl: false,
    w: 1,
    defaultExpirationTime:  1000 * 10 //60 * 60 * 24 * 14
};

module.exports = function(connect) {
    var Store = connect.Store || connect.session.Store;
    var _sessions = [];

    function getCachedSession(sid){

        var targetSession = null;
        var totalCount = _sessions.length;
        for (var i = 0; i < totalCount; i++){
            var session = _sessions[i];
            if ((session !== undefined) && (session !== null)){
                if (session.id !== sid)
                    continue;
            }
            targetSession = session;
            break;
        }
        //console.log('-- store cached session: ' + sid + '  found: ' + (targetSession !== null));
        return targetSession;
    }

    function addCachedSession(session){
        var index = _sessions.indexOf(session);
        if (index === 0)
            return;

        if (index > 0)
            _sessions.splice(index, 1);
        _sessions.splice(0, 0, session);

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

        var today = new Date();
        if ((dbSession.created === undefined) || (dbSession.created === null))
            dbSession.created = today;
        dbSession.updated = today;

        dbSession.data = JSON.stringify(session);
        if (session && session.cookie && session.cookie.expires) {
            dbSession.expiration = new Date(session.cookie.expires);
        } else {
            var expiration = new Date(today.getTime() + defaultOptions.defaultExpirationTime);
            if (dbSession.cookie)
                session.cookie.expires = expiration;
            dbSession.expiration = expiration;
        }

        dbSession
            .save()
            .then(function () {
                callback && callback(null);
            })
            .catch(function (err) {
                callback && callback(err);
            });
    }

    function loadSession(self, session, sid, callback){
        if (session) {
            if (!session.expiration || new Date < session.expiration) {
                callback(null, JSON.parse(session.data));
            } else {
                self.destroy(sid, callback);
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
        this.defaultExpirationTime = /*options.defaultExpirationTime ||*/ defaultOptions.defaultExpirationTime;
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
            loadSession(this, targetSession, sid, callback);
        else {

            var schemaSession = db.getObject('session', 'security');
            schemaSession.find(
                {
                    where: {id: sid}
                })
                .then(function (session) {
                    loadSession(this, session, sid, callback);
                })
                .catch(function (err) {
                    callback && callback(err, null);
                });
        }

        // console.log('-- store get: ' + sid);
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
                    addCachedSession(targetSession);
                    updateSession(targetSession, session, callback);
                })
                .catch(function (err) {
                    var targetSession = schemaSession.build();
                    targetSession.id = sid;
                    addCachedSession(targetSession);
                    updateSession(targetSession, session, callback);
                });
        }

        // console.log('-- store set: ' + sid);
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
            callback && callback();
        })
        .catch(function(err){
            callback && callback(err);
        })
        // console.log('-- store destroy: ' + sid);
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
        // console.log('-- store clear: ');
    };

    return Impl;
};

