var crypto = require('crypto');
var utils = require('./utils');
var user = require('./user');
var redis = require("redis"),
    client = redis.createClient();
//client.multi().set("key", "111").set("key1", "222").exec(redis.print)

var token2id = {}; //токен -> юзерайди
var id2token = {}; //юзерайди -> токен
exports.token2id = token2id;

function getRandomToken() {
	var token;
	do {
		token = "The Very Random TokKen "+Math.random();
	} while (token in token2id) //чтоб уж наверняка не совпал
	return token;
}

exports.handle_login = utils.handleAllIncoming(
	function(req, res, data) {
		var uid = data.viewer_id;
		//хешодела
		var hash = crypto.createHash('md5');
		hash.update(API_ID+"_"+uid+"_"+API_SECRET);
		hash = hash.digest('hex');
		if (data.auth_key != hash)
			throw new utils.HttpException(400, "VK auth failed.");
		
		var token;
		if ((token=id2token[uid]) !== undefined) //если есть старый токен для этого пользователя, ...
			delete token2id[token]; //... удаляем старый токен
		token2id[(token=getRandomToken())] = uid;
		id2token[uid] = token;
		
		//user.init(uid); //TODO: вызывать один раз при первом подключении. или при сбросе
		user.login(uid);
		
		res.writeHead(200, {'Content-Type': "text/plain"});
		res.write('{"action": "login", "token": "'+token+'"}');
		res.end();
		
		//а не хранить ли в базе ещё и айди всех, когда-либо подключавшихся?..
		client.sadd("user:log:id", uid);
		
		//текущий токен и все токены в лог
		console.log("-----\nSending token:\n"+token+"\nCurrent tokens:");
		for (var i in token2id) console.log(i+": "+token2id[i])
		console.log("-----")
	}
);

