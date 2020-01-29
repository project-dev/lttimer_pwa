// キャッシュの名前。ここを更新するたびに名前を変えるか、このファイルのようにバージョンをくっつけるかすればOK
var CACHE_NAME = 'lttimer';

var VERSION="1.0.1"

// キャッシュするファイル一覧
var CACHE_FILE = [
	 './index.html'
	,'./css/DSEG7Classic-Regular.woff'
	,'./css/PixelMplus10-Regular.woff'
	,'./js/jquery-1.9.1.min.js'
	,'./sound/Zihou01-mp3/Zihou01-1.mp3'
	,'./sound/Zihou01-mp3/Zihou01-1.ogg'
	,'./sound/silent.mp3'
	,'./sound/silent.ogg'
];

// キャッシュのキー
const CACHE_KEYS = [
	CACHE_NAME + VERSION
];

self.addEventListener('install', function(event) {
	console.log("ServiceWorker : install");
	try{
		// 強制的にServiceWorkerの制御を開始
		event.waitUntil(self.skipWaiting());

		event.waitUntil(
			caches.open(CACHE_NAME + VERSION).then(function(cache) {
				// キャッシュにファイルを登録する
				return cache.addAll(CACHE_FILE);
			})
		);
	}catch(e){
		console.log(e);
	}
});

self.addEventListener('activate', event => {
	console.log("ServiceWorker : activate");
	try{
		// 強制的にServiceWorkerの制御を開始
		event.waitUntil(self.clients.claim());
		event.waitUntil(
			caches.keys().then(keys => {
				return Promise.all(
					keys.filter(key => {
						console.log("ServiceWorker : key " + key+ " is exists.");
						return !CACHE_KEYS.includes(key);
					}).map(key => {
						// 不要なキャッシュを削除
						// ただし、複数のPWAを扱っている場合は余計なものを消さないように工夫が必要
						if(key.indexOf(CACHE_NAME) == 0){
							console.log("ServiceWorker : " + key+ " remove");
							return caches.delete(key);
						}else{
							console.log("ServiceWorker : " + key+ "no remove");
							return true;
						}
					})
				);
			})
		);
	}catch(e){
		console.log(e);
	}
});

self.addEventListener('fetch', function(event) {
	console.log("ServiceWorker : fetch");
	// オンライン true / オフライン false
	var online = navigator.onLine;
	try{
		if(online){
			onOnline(event);
		}else{
			onOffline(event);
		}
	}catch(e){
		console.log(e);
	}
});

function onOnline(event){
	console.log("ServiceWorker : online");
	console.log("ServiceWorker : target : " + event.request.url);
	event.respondWith(
		caches.match(event.request).then(
			function (response) {
				if (response) {
					// キャッシュを返す
					console.log("ServiceWorker : hit");
					return response;
				}
				return fetch(event.request).then(function(response){
					// キャッシュにないので追加
					// Responseはストリームなのでキャッシュなので複製
					cloneResponse = response.clone();
					if(!response || response.status != 200){
						//正常に取得できなかったときにハンドリングしてもよい
						console.log("ServiceWorker : request faild " + response.status);
					}else{
						//現行のキャッシュに追加
						caches.open(CACHE_NAME + VERSION).then(function(cache){
							cache.put(event.request, cloneResponse).then(function(){
								//正常にキャッシュ追加できたときの処理(必要であれば)
								console.log("casshed");
							});
						});
					}
					return response;
				}).catch(function(error) {
					//デバッグ用
					console.log(error)
					return console.log(error);
				});
			}
		)
	);
}

function onOffline(event){
	console.log("ServiceWorker : offline");
	event.respondWith(
		caches.match(event.request).then(
			function(response) {
				// キャッシュがあったのでそのレスポンスを返す
				if (response) {
					console.log("ServiceWorker : hit");
					return response;
				}
				console.log("ServiceWorker : no hit");

				//オフラインでキャッシュもなかったパターン
				return caches.match("offline.html").then(function(responseNodata){
					//適当な変数にオフラインのときに渡すリソースを入れて返却
					//今回はoffline.htmlを返しています
					return responseNodata;
				});
			}
		)
	);
}
