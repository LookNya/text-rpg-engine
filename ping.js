//коли кто с мечём придёт,
//от меча и огребёт
//*отправляет обратно принятую инфу*
function ping(path, req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
	req.addListener('data', function (chunk) {
		res.write(chunk);
		console.log(chunk);
	}).addListener('end', function () {
		res.end();
	});
}
exports.handle = ping;
