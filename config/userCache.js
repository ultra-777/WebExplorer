/**
 * Created by Andrey on 25.12.2014.
 */

var config = require('./config');
var _users = new Object();

process.on('message', function(msg){
    if (msg.cmd && msg.cmd == config.messageUpdateUser){
        console.log('--node: %d. drop user: %d', process.pid, msg.id);
        delete _users[msg.id];
    }
})

function add(user){
    _users[user.id] = user;
}

function get(id){
    return _users[id];
}


module.exports = {
    add: add,
    get: get
}
