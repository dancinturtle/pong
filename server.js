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
var availablePlayers = [];
var games = [];
function Player(name, sid){
	this.name = name,
	this.sid = sid,
	this.opponent = {name: null, sid: null}
}
function Game(room, challengedName, challengedSID, challengerName, challengerSID){
	this.room = room,
	this.challenged = {name: challengedName, sid: challengedSID},
	this.challenger = {name: challengerName, sid: challengerSID}
}
io.sockets.on('connection', function(socket){
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
		var avindex = "none";
		for(var j=0; j<availablePlayers.length; j++){
			if(availablePlayers[j].sid == socket.id){
				avindex = j;
				break;
			}
		}
		if (avindex != "none"){
			availablePlayers.splice(avindex, 1);
		}
		var gameindex = "none";
		for(var g=0; g<games.length; g++){
			if(games[g].challenged.sid == socket.id || games[g].challenger.sid == socket.id){
				gameindex = g;
				break;
			}
		}
		if(gameindex != 'none'){
			games.splice(gameindex, 1);
		}
		io.emit('updated_players', {response: availablePlayers});
  });
	//newplayer joins

	socket.on('newPlayer', function(data){
			var newPlayer = new Player(data.name, socket.id);
			allPlayers.push(newPlayer);
			availablePlayers.push(newPlayer);
			console.log("all the availalbe players", availablePlayers);
			socket.emit('playerID', {sid: newPlayer.sid});
			io.emit('updated_players', {response: availablePlayers});
		})
//when someone makes a new challenge
	socket.on('newChallenge', function(data){
		console.log("challenge against", data.challenged);
		//notify person they've been challenged, find out if they accept
		io.to(data.challenged).emit('youAreChallenged', {challengerName: data.challengerName, challengerID: data.challengerID});
	})
	//when someone denies the challenge
	socket.on('denyChallenge', function(data){
		io.to(data.challenger).emit('challengeDenied', {denier: data.challengedName})
	})
	//the challenged accepts, remove the challenged from availablePlayers array
	socket.on('acceptChallenge', function(data){
		console.log("challenge accepted");
		for(var k=0; k<availablePlayers.length; k++){
			if(availablePlayers[k].sid==data.challenged){
				var temp = availablePlayers[k];
				for(var o=0; o<availablePlayers.length; o++){
					if(availablePlayers[o].sid == data.challenger){
						var op = availablePlayers[o];
						break;
					}
				}
				temp.opponent.sid = op.sid;
				temp.opponent.name = op.name;
				op.opponent.sid = temp.sid;
				op.opponent.name = temp.name;
				console.log("The challenged", temp);
				console.log("The challenger", op);
				for(var m=k; m<availablePlayers.length-1; m++){
					availablePlayers[m] = availablePlayers[m+1];
				}
				availablePlayers[availablePlayers.length-1] = temp;
				availablePlayers.pop();
				break;
			}
		}
			io.emit('updated_players', {response: availablePlayers});

			var newRoom = data.challenger + data.challenged;
  		socket.join(newRoom);
			io.to(data.challenger).emit('yourChallengeIsAccepted', {challenged: data.challengedName, challengedID: data.challenged});
			// io.to(newRoom).emit('startFight', {message: "Hello"});


	})
	socket.on('meetUp', function(data){
		var playerIndex = "none";
		for(var k=0; k<availablePlayers.length; k++){
			if(availablePlayers[k].sid==data.challengerID){
				playerIndex = k;
				break;
			}
		}
		if(playerIndex != "none"){
			availablePlayers.splice(playerIndex, 1);
		}
		io.emit('updated_players', {response: availablePlayers});
		var roomName = data.challengerID + data.challengedID;
		var newGame = new Game(roomName, data.challenged, data.challengedID, data.challenger, data.challengerID);
		games.push(newGame);
		io.emit('updated_games', {games: games});
		socket.join(roomName);
		io.to(roomName).emit('startFight', {game: newGame});
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
