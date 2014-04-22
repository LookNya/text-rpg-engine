var TOKEN = 'error', VIEWERID='0', errorCounter = 0,
	errorShowTimeout, errorHideTimeout
	
//--------- First
function init(){
	
	VK.init(function() {
		 // API initialization succeeded
		 // Your code here
		VK.callMethod("scrollWindow",40,200)
		auth()
		
	});
	//VK.callMethod("setTitle","reDoodle") вид: Вконтакте/Редудл	
	setTimeout(function(){
					loader.setAttribute("class", "hideBlock")
					}, 300)         //Спрятали див "Загрузка..."
	setTimeout(function(){
					loader.style.display = "none"
					}, 450)         //Спрятали див "Загрузка..."
}	


/*
account.getAppPermissions
showInviteBox()
VK.showInstallBox()

VK.callMethod("showSettingsBox", 8448); //стена + меню слева


showOrderBox  Открывает окно для покупки товара в приложении или ввода голоса на счёт приложения. 
(string type)
*/
function whois(){
	d = document.location.search.substr(1);
	var p = d.split("&");
	var V = {}, curr;
	for (i = 0; i < p.length; i++) {
		curr = p[i].split('=');
		V[curr[0]] = curr[1];
	}
	VIEWERID = V['viewer_id']
	return {
		'auth_key': V['auth_key'],
		'viewer_id': V['viewer_id']
	}
}
//--------- gui
locations = {}                      // функции, вызываемые при смене локации
locations['forest'] = forest
locations['cave'] = cave

locNames = {}
locNames['forest'] = "Зеленый лес"
locNames['cave'] = "Влажные пещеры"

function changeLocation(loc){
	if(placeSlide.innerHTML != locNames[loc]){
		locations[loc]()            // Сменили локу, если юзер переходит на новую
	} else return
}

function forest(){
	currPlace.innerHTML = '<div id="placeSlide">Зеленый лес</div>'
}
function cave(){
	currPlace.innerHTML = '<div id="placeSlide">Влажные пещеры</div>'
}

function share(el){                 // Постит запись блога, около которой была нажата, на стену
	post = document.getElementById(el.getAttribute("postID")).innerHTML
	VK.api("wall.post", { owner_id: VIEWERID, message: post, attachments: "http://vk.com/app3751612"}, function (data) {});
}

function showInv(){
	if(inventory.getAttribute("class")=="invOpen")
		inventory.setAttribute("class", "invClose")
	else inventory.setAttribute("class", "invOpen")
}


//--------- Input
var action = {}                     // функции, вызываемые ответом на реквест
action['login'] = login             // сохранение токена
action['topErrorBox'] = topErrorBox // показать ошибку
action['relogin'] = relogin         // повторить авторизацию
action['resource_update'] = resourse
action['buy'] = buy


function login(data){
	TOKEN = data.token
}

function relogin(data, command){    //если запрос на сервер не выполнился, три попытки повторить его
	errorCounter++
	if (errorCounter>3){
		topErrorBox("Ошибка авторизации, обновите страницу.")
		return 0;
	}
	exec['auth']()                  //пытаемся авторизироваться еще раз
	exec[command]()                 //пытаемся выполнить запрос на сервер
}

function topErrorBox(str){          //показываем ошибку сверху справа, появляемся
	clearTimeout(errorShowTimeout)
	clearTimeout(errorHideTimeout)
	errorBox.setAttribute("class", "showError")
	errorBoxContent.innerHTML = str
	errorBox.style.display = "block"
	errorShowTimeout = setTimeout(function(){        //исчезаем
		errorBox.setAttribute("class", "hideBlock") 
		}, 3000)
	errorHideTimeout = setTimeout(function(){        //обнуляемся и прячем
		errorBox.setAttribute("class", "") 
		errorBoxContent.innerHTML = ""
		errorBox.style.display = "none"
		}, 4000)
}

function resourse(data){
	addPostToBlog(data)
}

function buy(){

}

function addPostToBlog(message){    //добавить сообщение в блог слева
	var div = document.createElement("div");
	div.innerHTML = '<div class="postContent" id="post">'
					+ JSON.stringify(message).replace(/,/g, ", ") + 
					'</div><div class="sharePost"; onclick = "share(this)" postID="post">Поделиться</div>'
	div.setAttribute("class", "post")
	left.insertBefore(div, left.firstChild); //сделали див по шаблону, поместили первым в блок блога
	if (left.children.length > 5)//if(document.getElementsByClassName("post").length > 40) //удалить посты, которые не видно
		left.removeChild(left.lastElementChild);//	left.removeChild(document.getElementsByClassName("post")[40])
}

//--------- Output
var exec = {}                       // функции-запросы на сервер. Все вида: путь, запрос, название команды для повтора вслучие ошибки авторизации 
exec['auth'] = auth                 //запрос авторизации
exec['send']  = send
exec['reset']  = reset              //запрос сброса профиля

function auth(){                    // вытянули из вконтакта вьюер айди, аус кей и переслали
	request('auth', JSON.stringify(whois()), 'auth')
}

function send(){
	request("user/update_counters", JSON.stringify({
												"token": TOKEN
												}), 'send')
}

function reset(){
	request("user/update_counters", JSON.stringify({
												"token": TOKEN,
												"viewer": VIEWERID,
												"action": "reset"
												}), 'reset')
}



function request(path, message, command){//путь, сообщение, какую команду повторить в случае ошибки авторизации
var xhr = new XMLHttpRequest();
	xhr.open("POST", 'http://91.144.179.84:9005/'+path , true);
	xhr.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT"); //ответы сервера больше не кешируются
	xhr.send(message);
	xhr.onreadystatechange=function(){
		if (xhr.readyState==4 && xhr.status==200){
			incoming = JSON.parse(xhr.responseText)   //распарсили ответ 
			action[incoming.action](incoming, command)//выполнили команду сервера
		}
		if (xhr.status==404 || xhr.status==400) action['topErrorBox'](xhr.responseText) //показали ошибку
	}
}


