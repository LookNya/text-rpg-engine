/*
// Server.js (упрощённый)
var cluster = require('cluster');

var config = {
    numWorkers: require('os').cpus().length,
};

cluster.setupMaster({
    exec: "worker.js"
});

// Fork workers as needed.
for (var i = 0; i < config.numWorkers; i++)
    cluster.fork()
                                            Все очень серьезно.
*/ 

//var sys = require('sys');
var http = require('http');
var url = require('url');
var static = require('node-static'),
    fileServer = new static.Server('./www', { cache: 0 });//"no-cache"
var settings = require('./settings');


//роутер
var router = {};
router["/adventure_ready"] = function(path, req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write('<img src="https://pp.vk.me/c9342/v9342722/1166/96_6egADa4I.jpg">');
	res.end();
}
router["/ping"] = require('./ping').handle;
router["/auth"] = require('./auth').handle_login;
router["/user/update_counters"] = require('./user').handle_updateCounters;
router["/donate"] = require('./donate').handle_donate;

http.createServer(function (req, res) {
	var path = url.parse(req.url, true).pathname;
	var route = router[path];
	if (route !== undefined) {
		route(path, req, res); //есть, куда роутить - роутим
		return;
	}
	//нет, куда роутить - пытаемсь отдать статический файл
	fileServer.serve(req, res);
}).listen(PORT);

console.log("Started on port "+PORT);


/*
document.body.innerHTML='<div id="test" contentEditable=true>чёрный текст <span style="color:red;">красный текст</span></div>';
test.addEventListener('textInput',function (e) {
console.log(window.getSelection())
console.log(test.innerHTML)
console.log(e);
},false);
*/
