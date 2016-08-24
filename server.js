//require express
var express = require('express');
//path module
var path = require('path');
//create express app
var app = express();
//require body-parser
var bodyParser = require('body-parser');
//create express app
var app = express();
//use body-parser
app.use(bodyParser.urlencoded({extended: true}));

//static content

app.use(express.static(path.join(__dirname, "./static")));
//setting up ejs and our views folder
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

//root route to render the index.ejs view
app.get('/', function(req, res){
	res.render('index');
});
//post route for adding a user
// app.post('/result', function(req, res){
// 	console.log("POST DATA", req.body);
// 	res.render('result', {results: req.body});
// 	//This is where we would add the user to the database
// 	//Then redirect to the root route
// 	// res.redirect('/');
// });
// app.get('/result', function(req, res){
// 	res.render('result');
// });
//the the express app to listen on port 8000
var server = app.listen(8000, function(){
	console.log("listening on port 8000");
});

var io = require('socket.io').listen(server);
var allPlayers = [];
io.sockets.on('connection', function(socket){
  console.log('a user connected', socket.id);
	//disconnecting
  socket.on('disconnect', function(){
		//want to remove the player from allPlayers with this socket id
    console.log('user disconnected', socket.id);
		var index = "none";
		for(var i=0; i<allPlayers.length; i++){
			if(allPlayers[i].sid == socket.id){
				index = i;
				break;
			}
		}
		if(index != "none"){
			allPlayers.splice(index, 1);
		}
		io.emit('updated_players', {response: allPlayers});
  });
	//newplayer joins

	socket.on('newPlayer', function(data){
			var newPlayer = {name: null, sid: null};
			newPlayer.name = data.name;
			newPlayer.sid = socket.id;
			allPlayers.push(newPlayer);
			console.log("all the players", allPlayers);
			socket.emit('playerID', {sid: newPlayer.sid});
			io.emit('updated_players', {response: allPlayers});
		})

	socket.on('newChallenge', function(data){
		console.log("challenge against", data.challenged);
		io.to(data.challenged).emit('youAreChallenged', {challengerName: data.challengerName, challengerID: data.challengerID});
	})
	io.on('acceptChallenge', function(socket){
		console.log("challenge accepted");
		// var challenged = data.challenged;
		// var challenger = data.challenger;
		// io.on('connection', function(challenged){
  		socket.join('tournament');
			io.to('tournament').emit('startFight', {message: "Hello"});
		// });

	})
});

// var players = [];

// 	socket.on('redUp', function(data){
//
// 		// console.log('Red is moving up' + data.redY);
// 		io.emit('updated_red', {response: data.redY});
// 	});
// 	socket.on('redDown', function(data){
// 		// console.log('Red is moving down' + data.redY);
// 		io.emit('updated_red', {response: data.redY});
// 	});
//
// 	socket.on('playerQuit', function(data){
// 		console.log("the array", players);
// 		console.log("the quitter", data);
// 		var test = players.map(function(thing){
// 			return thing.id;
// 		});
// 		var index = test.indexOf(data.player.id);
// 		var temp = players[index];
// 		for(var i=index; i<players.length; i++){
// 			players[i]=players[i+1];
// 		}
// 		players[players.length-1] = temp;
// 		players.pop();
// 		for(var j=0; j<players.length; j++){
// 			players[j].id=j+1;
// 		}
// 		console.log("new array", players);
// 		io.emit('updated_players', {response:players});
		// console.log('testalkfajksljfaklsjdfaklsjfdkalj, ', test.indexOf(data.player.id));

// });
