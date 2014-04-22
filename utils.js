function error404(res, info) {
	res.writeHead(404, {'Content-Type': "text/plain"});
	if (info) res.write(info);
	res.end();
}
exports.error404 = error404;

function error(res, code, info) {
	res.writeHead(code, {'Content-Type': "text/plain"});
	if (info) res.write(info);
	res.end();
}
exports.error = error;

function resJSON(res, data) {
	res.writeHead(200, {'Content-Type': "text/plain"});
	res.write(JSON.stringify(data));
	res.end();
}
exports.resJSON = resJSON;

function resText(res, data) {
	res.writeHead(200, {'Content-Type': "text/plain"});
	res.write(data);
	res.end();
}
exports.resText = resText;

//эксепшн. удобно кидаться из следующей функции
exports.HttpException = function(code, text) {
	this.code = code;
	this.text = text;
}
//принимает всё, что клиент хотел нам сказать,
//пробует парсить как ЖСОН,
//отправляет напарсенное в каллбек
exports.handleAllIncoming = function(callback) {
	return function(path, req, res) {
		var data = "";
		req.addListener('data', function (chunk) {
			data += chunk;
		}).addListener('end', function () {
			try {
				parsed_data = JSON.parse(data);
			} catch(e) {
				error(res, 400, "<pre><b>JSON parse error:</b><br>"+e.toString()+"<br><b>in</b><br>"+data+"</pre>");
				return;
			}
			
			try {
				callback(req, res, parsed_data);
			} catch(e) {
				var code = e.code;
				if (code !== undefined) {
					error(res, code, e.text);
				} else {
					error(res, 500, e.toString());
					console.log(e);
				}
				return;
			}
		});
	}
}
