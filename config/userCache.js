/**
 * Created by Andrey on 25.12.2014.
 */

var _users = [];

function add(user){
    _users.splice(0, 0, user);
}

function get(id){
    var count = _users.length;
    for (var i = 0; i < count; i++){
        var candidate = _users[i];
        if (candidate.id === id){
            return candidate;
        }
    }
    return null;
}



module.exports = {
    add: add,
    get: get
}
