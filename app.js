var twitter = require('ntwitter');
var twit = new twitter({
    consumer_key : "dPKMNnVLrE03VeX510q18Q",
    consumer_secret : "3prbNGKvnAHZQtBzkfC95SoFac5nDDEHjkXzLy8Xg",
    access_token_key : "262621680-wGGzI0R5kQDplB90kWAnguZj9L6koZr2KoS0iQyI",
    access_token_secret : "ZcV2BebwhG7my4E2zIJIbrohgp8U5ncu0CeIOKzg"
});
var get_redis_client = function() {
    var redis = require('redis');
    if (process.env.REDISTOGO_URL) {
        var rtg = require('url').parse(process.env.REDISTOGO_URL);
        var client = redis.createClient(rtg.port, rtg.hostname);
        client.auth(rtg.auth.split(':')[1]);
        return client;
    }
    else {
        return redis.createClient();
    }
};
var redis = get_redis_client();
var save_stat = function(user, stat) {
    redis.hincrby(user, stat, 1);
};
var user_re = /@.*?\s/g;
var process = function(text) {
    var users = text.match(user_re);
    var stat = text.replace(user_re, '');
    for (var i in users) {
        var user = users[i].replace(' ', '');
        if (user != '@giveastat') {
            save_stat(user, stat);
        }
    }
};
var open_stream = function() {
    var attempts = 1;
    var max_attempts = 5;
    twit.stream('user', {track : 'giveastat'}, function(stream) {
        stream.on('data', function(data) {
            if (typeof(data.text) != 'undefined') {
                process.nextTick(function(){process(data.text);});
            }
        });
        stream.on('end', function(response) {
        });
        stream.on('destroy', function(response) {
            if (attempts++ <= max_attempts) {
                open_stream();
            }
        });
    });
};
open_stream();
