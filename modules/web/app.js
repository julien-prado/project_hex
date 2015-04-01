module.exports = function(nconf,client_pub,client_sub) {
	nconf.file('web', __dirname+'/config.json');
	var express			= require( 'express' )
	  , app				= express()
	  , server			= require( 'http' ).createServer( app ) 
	  , passport		= require( 'passport' )
	  , util			= require( 'util' )
	  , bodyParser		= require( 'body-parser' )
	  , cookieParser	= require( 'cookie-parser' )
	  , session			= require( 'express-session' )
	  , flash			= require( 'connect-flash')
	  , RedisStore      = require( 'connect-redis' )( session )
	  , sessionStore 	= new RedisStore({host: nconf.get('web:REDIS:host'), port: nconf.get('web:REDIS:port')});
	  
	require('./passport/init.js')(nconf,passport);

	require('./routes/editor/socket.js')(nconf,server,sessionStore,cookieParser,client_pub,client_sub);

	// configure Express
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use( express.static(__dirname + '/public'));
	app.use( cookieParser()); 
	app.use( bodyParser.json());
	app.use( bodyParser.urlencoded({
		extended: true
	}));
	app.use( session({ 
		secret: 'cookie_secret',
		store:  sessionStore,
		proxy:  true,
		resave: true,
		saveUninitialized: true
	}));
	app.use( passport.initialize());
	app.use( passport.session());
	app.use( flash())

	app.use('/', require('./routes/index.js')(passport));
	app.use('/editor', require('./routes/editor.js')(passport));
	app.use('/game', require('./routes/game.js')(passport));

	server.listen( nconf.get('APP:port') );
}