var redis = require("redis"),
    client = redis.createClient();
var utils = require('./utils');
var auth = require('./auth');

//список автоувеличиваемых ресурсов
//user:12345:res:iron 123   - 123 железяки (если путо, не отображать на гуй)
//user:12345:res:iron:incr 1   - +1 в секунду (не должно быть пусто)
//user:12345:res:lut 54321   - last update time (и это не должно)
var resource = [
	"iron"
];
var resource_prefix = resource.map(function(x) {return ":res:"+x});
var resource_incr = resource_prefix.map(function(x) {return x+":incr"});

var user_data = {};
exports.user_data = user_data;

//инициализация. или сброс всего
exports.init = function(uid) {
	var user_prefix = "user:"+uid;
	client.set(user_prefix+":res:lut", new Date().getTime());
	
	var m = client.multi();
	for (var i=0; i<resource.length; i++)
		m.set(user_prefix + resource_incr[i], 1);
	m.exec(function(err, arr) {
		console.log("init "+uid+": "+arr)
		//TODO: callback
	});
}
exports.login = function(uid) {
	user_data[uid] = {time_error: 0};
}

exports.handle_updateCounters = utils.handleAllIncoming(
function(req, res, data) {
	var uid = auth.token2id[data.token];
	if (uid === undefined) //нет токена - в релогин
		throw new utils.HttpException(200, '{"action": "relogin"}');
	
	var user_prefix = "user:"+uid;
	var cur_time = new Date().getTime();
	var updatig_resources = []; //какие ресурсы обнавлать (у каких прирост не 0)
	
	var muResIncr = client.multi(); //создаём мультизапрос (запрос прироста)
	muResIncr.getset( user_prefix + ":res:lut", cur_time ); //получаем время последнего обновления и меняем на "сейчас"
	for (var i=0; i<resource.length; i++)
		muResIncr.get( user_prefix + resource_incr[i] ); //запрашиваем скорости прироста ресурсов
	muResIncr.exec(onIncreaseResourses); //выполняем мультизапрос (он вернёт в каллбек массив)
	
	function onIncreaseResourses(err, arr)
	{
		var last_time = parseInt(arr[0]);
		var time_delta = cur_time - last_time + user_data[uid].time_error;
		user_data[uid].time_error = time_delta%1000;
		time_delta = (Math.min(USER_TIMEOUT, time_delta)/1000)|0; //сколько прошло с последнего апдейта. секунд. целых. не больше таймаута
		
		var muResUpdate = client.multi();//новый мультизапрос (приращение кол-ва)
		for (var i=1; i<arr.length; i++) { // в i=0 влемя последнего обновления
			if (arr[i] === '0') continue;
			updatig_resources.push(i-1);
			muResUpdate.incrby(user_prefix + resource_prefix[i-1],
			                   parseInt(arr[i])*time_delta);
		}
		muResUpdate.exec(onGetResourses); //выполняем
	}
	
	function onGetResourses(err, arr)
	{
		//incrby увеличивает и возвращает результат прибавления
		//массив этих результатов отправляем клиенту
		var resource_info = {};
		for (var i=0; i<arr.length; i++)
			resource_info[resource[updatig_resources[i]]] = arr[i];
		
		utils.resText(res, '{"action": "resource_update",'+
			'"resources": '+JSON.stringify(resource_info)+'}');
	}
});

