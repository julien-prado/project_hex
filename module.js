var nconf = require('nconf');
nconf.argv().file('default','config.json');

var redis 			= require("redis")
	, client_pub 	= redis.createClient({host: nconf.get('REDIS:host'), port: nconf.get('REDIS:port')})
	, client_sub 	= redis.createClient({host: nconf.get('REDIS:host'), port: nconf.get('REDIS:port')});
	

require('./modules/'+nconf.get('module_name')+'/app.js')(nconf,client_pub,client_sub);