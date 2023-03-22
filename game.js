var states = {
	LOBBY: 0,
	INTRO: 1,
	ROUND_INTRO: 2,
	ROUND: 3,
	ROUND_SCORES: 4,
	SCORES: 5,
	WINNER: 6,
	END: 7
};

function Games(){
	var games = {};
	
	this.createGame = function(){
		var id = this.generateId();
		games[id] = new Game();
		games[id].setId(id);
		return games[id];
	}
	
	this.generateId = function(){
		var id;
		do{
			id = '';
			var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			var length = letters.length;
			for(var i = 0; i < 4; i++) id += letters.charAt(Math.floor(Math.random() * length));
			for(var g in games) if(games[g] && games[g].getId() == id) id = false;
		}
		while(!id);
		return id;
	}
	
	this.newLobby = function(gameId){
		var game = games[gameId];
		if(!game) return;
		var id = this.generateId();
		games[id] = game;
		game.setId(id);
		game.newLobby();
	}
	
	this.removeGame = function(gameId){
		if(gameId in games){
			games[gameId].disconnectAll();
			delete games[gameId];
			games[gameId] = false;
		}
	}
	
	this.getGame = function(gameId){
		if(gameId in games) return games[gameId];
		else return false;
	}
}

function Game(){
	var gameId = false;
	var round = false;
	var playerIds = false;
	var team1Data = false;
	var team2Data = false;
	var promptData = false;
	var safetyQuips = false;
	var currentPrompt = false;
	var audience = false;
	var host = false;
	var body1 = false;
	var body2 = false;
	var team1 = new Team();
	var team2 = new Team();
	var team1Timer = false;
	var team2Timer = false;
	var gameState = new GameState();
	gameState.setState(states.LOBBY, {});
	
	this.setId = function(pId){
		gameId = pId;
	}
	
	this.getId = function(){
		return gameId;
	}
	
	this.addUser = function(user){
		if(user.getPlayer() && gameState.get() != states.LOBBY) return;
		if(user.getHost() && !host){
			host = user;
			user.setGameId(gameId);
		}
		else if(user.getPlayer()){
			if(playerIds) playerIds.push(user.getUniqueId());
			else playerIds = [user.getUniqueId()];
			if(team1.getPlayerCount() <= team2.getPlayerCount()) team1.addPlayer(user);
			else team2.addPlayer(user);
			user.setGameId(gameId);
			if(host){
				const data = this.getUserData(host.getUniqueId());
				host.sendTeamsUpdate(data.team1, data.team2);
			}
		}
	}
	
	this.getUser = function(userId){
		if(host && userId == host.getUniqueId()) return host;
		var player = team1.getPlayerById(userId);
		if(player) return player;
		player = team2.getPlayerById(userId);
		return player ? player : false;
	}
	
	this.removeUser = function(userId){
		if(host && userId == host.getUniqueId()){
			host.disconnectUser();
			host = false;
		}
		else{
			team1.removeUser(userId);
			team2.removeUser(userId);
		}
	}
	
	this.getState = function(){
		return gameState.get();
	}
	
	this.getPlayerCount = function(){
		return team1 && team2 ? team1.getPlayerCount() + team2.getPlayerCount() : 0;
	}
	
	this.hasPlayer = function(playerName){
		const allPlayers1 = team1.getAll();
		for(var p in allPlayers1) if(allPlayers1[p] && allPlayers1[p].getName() == playerName) return true;
		const allPlayers2 = team2.getAll();
		for(var p in allPlayers2) if(allPlayers2[p] && allPlayers2[p].getName() == playerName) return true;
		return false;
	}
	
	this.getUserData = function(userId){
		var user = this.getUser(userId);
		if(!user) return {};
		const state = gameState.get();
		if(user.getHost()){
			var players1 = false;
			var players2 = false;
			if(playerIds){
				const playerCount1 = team1.getPlayerCount();
				players1 = [];
				for(let i = 0; i < playerCount1; i++) players1.push(team1.getPlayerByIndex(i).getName());
				const playerCount2 = team2.getPlayerCount();
				players2 = [];
				for(let i = 0; i < playerCount2; i++) players2.push(team2.getPlayerByIndex(i).getName());
			}
			const captain1 = team1Data ? team1.getPlayerByIndex(team1Data.captains[round]) : false;
			const captain2 = team2Data ? team2.getPlayerByIndex(team2Data.captains[round]) : false;
			const bench1 = team1Data && team1Data.bench ? team1.getPlayerByIndex(team1Data.bench[round]) : false;
			const bench2 = team2Data && team2Data.bench ? team2.getPlayerByIndex(team2Data.bench[round]) : false;
			return {
				code: gameId,
				state: state,
				min_players: prefs.min_players_per_team,
				max_players: prefs.max_players_per_team,
				round: round,
				body1: body1,
				body2: body2,
				team1: team1Data ? {
					players: players1,
					captain: captain1 ? captain1.getName() : false,
					bench: bench1 ? bench1.getName() : false,
					turn: team1Data.current_turn,
					clear_players: team1Data.clear_players,
					clear_bonus: team1Data.clear_bonus,
					time_left: team1Timer.getDigitalTime(),
					time_bonus: team1Data.time_bonus,
					moves: team1Data.moves,
					move_bonus: team1Data.move_bonus,
					round_score: team1Data.score,
					total_score: team1.getScore()
				} : { players: players1 },
				team2: team2Data ? {
					players: players2,
					captain: captain2 ? captain2.getName() : false,
					bench: bench2 ? bench2.getName() : false,
					turn: team2Data.current_turn,
					clear_players: team2Data.clear_players,
					clear_bonus: team2Data.clear_bonus,
					time_left: team2Timer.getDigitalTime(),
					time_bonus: team2Data.time_bonus,
					moves: team2Data.moves,
					move_bonus: team2Data.move_bonus,
					round_score: team2Data.score,
					total_score: team2.getScore()
				} : { players: players2 }
			};
		}
		else if(user.getPlayer()){
			var team;
			var teamData;
			var teamNumber;
			var player = team1.getPlayerById(userId);
			if(player){
				team = team1;
				teamData = team1Data;
				teamNumber = 0;
			}
			else{
				player = team2.getPlayerById(userId);
				if(player){
					team = team2;
					teamData = team2Data;
					teamNumber = 1;
				}
			}
			var teammates = [];
			const playerCount = team.getPlayerCount();
			for(let i = 0; i < playerCount; i++) teammates.push(team.getPlayerByIndex(i).getName());
			var captain = false;
			var bench = false;
			var body = false;
			if(teamData){
				for(let i = 0; i < playerCount; i++){
					if(userId == teamData.players[i]){
						captain = i == teamData.captains[round] ? true : teamData.captains[round];
						bench = teamData.bench ? (i == teamData.bench[round] ? true : teamData.bench[round]) : false;
						const brains = teamData.brains;
						if(brains){
							for(let j = 0; j < brains.length; j++) if(i == brains[j]) body = i == j ? true : j;
						}
					}
				}
			}
			return {
				state: state,
				name: player.getName(),
				team: teamNumber,
				teammates: teammates,
				captain: captain,
				bench: bench,
				body: body,
				turn: teamData ? teamData.current_turn : false,
				body1: body1,
				body2: body2,
				finished: teamData ? teamData.finished : false
			};
		}
		else return {};
	}
	
	this.changeTeam = function(userId){
		var currentTeam = false;
		var newTeam = false;
		var teamNumber = false;
		var player = team1.getPlayerById(userId);
		if(player){
			currentTeam = team1;
			newTeam = team2;
			teamNumber = 1;
		}
		else{
			player = team2.getPlayerById(userId);
			if(player){
				currentTeam = team2;
				newTeam = team1;
				teamNumber = 0;
			}
			else return;
		}
		currentTeam.removePlayer(userId);
		newTeam.addPlayer(player);
		if(host){
			const data = this.getUserData(host.getUniqueId());
			host.sendTeamsUpdate(data.team1, data.team2);
		}
		player.sendLobbyUpdate(teamNumber);
	}
	
	this.startGame = function(){
		round = 0;
		var curState = gameState.get();
		if(curState != states.LOBBY && curState != states.END) return;
		gameState.setState(states.INTRO, {});
		team1.resetScore();
		team2.resetScore();
		if(host) host.sendStateUpdate(this.getUserData(host.getUniqueId()));
		for(let i = 0; i < playerIds.length; i++){
			var player = team1.getPlayerById(playerIds[i]);
			if(!player) player = team2.getPlayerById(playerIds[i]);
			if(player) player.sendStateUpdate(this.getUserData(playerIds[i]));
		}
	}
	
	this.hasStarted = function(){
		var curState = gameState.get();
		return curState != states.LOBBY;
	}
	
	this.continue = function(){
		var curState = gameState.get();
		if(curState == states.LOBBY || curState == states.END) return;
		else if(curState == states.SCORES){
			if(round < 2){
				round++;
				curState = states.ROUND_INTRO;
			}
			else curState = states.WINNER;
		}
		else if(curState == states.WINNER){
			this.endGame();
			return;
		}
		else curState++;
		if(curState == states.ROUND_INTRO){
			if(round == 0){
				var team1Start = Math.floor(Math.random() * 2) == 0;
				team1Data = {
					players: [],
					captains: [],
					bench: false,
					round_start: team1Start,
					current_turn: team1Start,
					brains: [],
					finished: false,
					clear_players: 0,
					clear_bonus: 0,
					time_left: false,
					time_bonus: 0,
					moves: 0,
					move_bonus: 0,
					score: 0
				};
				team2Data = {
					players: [],
					captains: [],
					bench: false,
					round_start: !team1Start,
					current_turn: !team1Start,
					brains: [],
					finished: false,
					clear_players: 0,
					clear_bonus: 0,
					time_left: false,
					time_bonus: 0,
					moves: 0,
					move_bonus: 0,
					score: 0
				};
				for(let i = 0; i < playerIds.length; i++){
					if(team1.getPlayerById(playerIds[i])) team1Data.players.push(playerIds[i]);
					else if(team2.getPlayerById(playerIds[i])) team2Data.players.push(playerIds[i]);
				}
				const playerCount1 = team1.getPlayerCount();
				const playerCount2 = team2.getPlayerCount();
				const minPlayerCount = Math.min(playerCount1, playerCount2);
				var affordances = 0;
				var totalWeight = 0;
				for(let i = 1; i <= minPlayerCount; i++){
					var currentWeight = 0;
					for(let j = 0; j < i; j++) currentWeight += j;
					affordances += currentWeight * currentWeight;
					totalWeight += currentWeight;
				}
				const turnSeconds = Math.floor(affordances * 6.0 / totalWeight) * 5;
				team1Timer = new Timer(turnSeconds, function(game){
					return function(){
						team1Data.finished = true;
						game.endTurn();
					}
				}(this));
				team2Timer = new Timer(turnSeconds, function(game){
					return function(){
						team2Data.finished = true;
						game.endTurn();
					}
				}(this));
				const maxPlayerCount = Math.max(playerCount1, playerCount2);
				var playerIndices = [];
				for(let i = 0; i < maxPlayerCount; i++){
					playerIndices.push({
						team1: true,
						team2: true
					});
				}
				for(let i = 0; i < 3; i++){
					var r;
					do r = Math.floor(Math.random() * playerCount1);
					while(!playerIndices[r].team1);
					team1Data.captains.push(r);
					playerIndices[r].team1 = false;
					do r = Math.floor(Math.random() * playerCount2);
					while(!playerIndices[r].team2);
					team2Data.captains.push(r);
					playerIndices[r].team2 = false;
				}
				var teamData = playerCount1 > playerCount2 ? team1Data : playerCount1 < playerCount2 ? team2Data : false;
				if(teamData){
					playerIndices = [];
					for(let i = 0; i < maxPlayerCount; i++) playerIndices.push(true);
					teamData.bench = [];
					for(let i = 0; i < 3; i++){
						var r;
						do r = Math.floor(Math.random() * maxPlayerCount);
						while(!playerIndices[r] || r == teamData.captains[i]);
						teamData.bench.push(r);
						playerIndices[r] = false;
					}
				}
			}
			else{
				team1Data.round_start = !team1Data.round_start;
				team2Data.round_start = !team2Data.round_start;
				team1Data.current_turn = team1Data.round_start;
				team2Data.current_turn = team2Data.round_start;
				team1Data.brains = [];
				team2Data.brains = [];
				team1Data.finished = false;
				team2Data.finished = false;
				team1Data.clear_players = 0;
				team2Data.clear_players = 0;
				team1Data.clear_bonus = 0;
				team2Data.clear_bonus = 0;
				team1Data.time_left = false;
				team2Data.time_left = false;
				team1Data.time_bonus = 0;
				team2Data.time_bonus = 0;
				team1Data.moves = 0;
				team2Data.moves = 0;
				team1Data.move_bonus = 0;
				team2Data.move_bonus = 0;
				team1Data.score = 0;
				team2Data.score = 0;
			}
			const playerCount1 = team1Data.players.length;
			const playerCount2 = team2Data.players.length;
			const minPlayerCount = Math.min(playerCount1, playerCount2);
			const maxPlayerCount = Math.max(playerCount1, playerCount2);
			var playerIndices = [];
			for(let i = 0; i < maxPlayerCount; i++){
				playerIndices.push({
					team1: !team1Data.bench || i != team1Data.bench[round],
					team2: !team2Data.bench || i != team2Data.bench[round]
				});
			}
			var playerBrains1 = [];
			var playerBrains2 = [];
			for(let i = 0; i < maxPlayerCount; i++){
				var r;
				if(i < playerCount1 && (!team1Data.bench || i != team1Data.bench[round])){
					do r = Math.floor(Math.random() * playerCount1);
					while(!playerIndices[r].team1);
					playerBrains1.push(r);
					playerIndices[r].team1 = false;
				}
				if(i < playerCount2 && (!team2Data.bench || i != team2Data.bench[round])){
					do r = Math.floor(Math.random() * playerCount2);
					while(!playerIndices[r].team2);
					playerBrains2.push(r);
					playerIndices[r].team2 = false;
				}
			}
			for(let i = 0; i < maxPlayerCount; i++){
				const team1Bench = i < playerCount1 && team1Data.bench && i == team1Data.bench[round];
				if(team1Bench) team1Data.brains.push(i);
				const team2Bench = i < playerCount2 && team2Data.bench && i == team2Data.bench[round];
				if(team2Bench) team2Data.brains.push(i);
				if(!team1Bench || !team2Bench){
					for(let j = 0; j < minPlayerCount; j++){
						if(!team1Bench && i == playerBrains1[j]) team1Data.brains.push(playerBrains1[(j + 1) % minPlayerCount]);
						if(!team2Bench && i == playerBrains2[j]) team2Data.brains.push(playerBrains2[(j + 1) % minPlayerCount]);
					}
				}
			}
		}
		else if(curState == states.ROUND){
			if(team1Data.round_start) team1Timer.resume();
			else if(team2Data.round_start) team2Timer.resume();
		}
		else if(curState == states.ROUND_SCORES){
			const minPlayerCount = Math.min(team1.getPlayerCount(), team2.getPlayerCount());
			const multiplier = round < 2 ? 1 : 2;
			team1Timer.reset();
			team2Timer.reset();
			team1Data.clear_bonus = Math.floor(multiplier * team1Data.clear_players * 100.0 / minPlayerCount);
			team2Data.clear_bonus = Math.floor(multiplier * team2Data.clear_players * 100.0 / minPlayerCount);
			if(team1Data.time_left > 0){
				team1Data.time_bonus = Math.floor(multiplier * team1Data.time_left * 500.0 / team1Timer.getSecondsLeft());
				team1Data.move_bonus = Math.floor(multiplier * (minPlayerCount - 1) * 500.0 / team1Data.moves);
			}
			if(team2Data.time_left > 0){
				team2Data.time_bonus = Math.floor(multiplier * team2Data.time_left * 500.0 / team2Timer.getSecondsLeft());
				team2Data.move_bonus = Math.floor(multiplier * (minPlayerCount - 1) * 500.0 / team2Data.moves);
			}
			team1Data.score = team1Data.clear_bonus + team1Data.time_bonus + team1Data.move_bonus;
			team2Data.score = team2Data.clear_bonus + team2Data.time_bonus + team2Data.move_bonus;
		}
		else if(curState == states.SCORES){
			team1.addToScore(team1Data.score);
			team2.addToScore(team2Data.score);
			if(round >= 2) curState = states.WINNER;
		}
		gameState.setState(curState, {});
		if(host) host.sendStateUpdate(this.getUserData(host.getUniqueId()));
		for(let i = 0; i < playerIds.length; i++){
			var player = team1.getPlayerById(playerIds[i]);
			if(!player) player = team2.getPlayerById(playerIds[i]);
			if(player) player.sendStateUpdate(this.getUserData(playerIds[i]));
		}
	}
	
	this.selectBody = function(userId, body){
		if(gameState.get() != states.ROUND) return;
		var teamData = false;
		var player = team1.getPlayerById(userId);
		if(player) teamData = team1Data;
		else{
			player = team2.getPlayerById(userId);
			if(player) teamData = team2Data;
			else return;
		}
		if(!teamData.current_turn) return;
		if(userId != teamData.players[teamData.captains[round]]) return;
		if(!(body1 === false) && body == body1) body1 = false;
		else if(!(body2 === false) && body == body2) body2 = false;
		else if(body1 === false) body1 = body;
		else if(body2 === false) body2 = body;
		if(host) host.sendRoundUpdate(this.getUserData(host.getUniqueId()));
		player.sendRoundUpdate(this.getUserData(userId));
	}
	
	this.swapBodies = function(userId){
		if(gameState.get() != states.ROUND) return;
		var teamData;
		if(team1Data.current_turn){
			team1Timer.pause();
			teamData = team1Data;
		}
		else if(team2Data.current_turn){
			team2Timer.pause();
			teamData = team2Data;
		}
		else return;
		if(userId != teamData.players[teamData.captains[round]] || body1 === false || body2 === false) return;
		teamData.moves++;
		var t = teamData.brains[body1];
		teamData.brains[body1] = teamData.brains[body2];
		teamData.brains[body2] = t;
		teamData.clear_players = 0;
		const playerCount = teamData.players.length;
		var finished = true;
		for(let i = 0; i < playerCount; i++){
			const playerClear = i == teamData.brains[i];
			finished &= playerClear;
			if(playerClear && (!teamData.bench || i != teamData.bench[round])) teamData.clear_players++;
		}
		teamData.finished = finished;
		this.endTurn();
	}
	
	this.endTurn = function(){
		if(gameState.get() != states.ROUND) return;
		body1 = false;
		body2 = false;
		if(team1Data.current_turn){
			team1Data.time_left = team1Timer.getSecondsLeft();
			team1Data.current_turn = !team1Data.finished && team2Data.finished;
			team2Data.current_turn = !team2Data.finished;
		}
		else if(team2Data.current_turn){
			team2Data.time_left = team2Timer.getSecondsLeft();
			team1Data.current_turn = !team1Data.finished;
			team2Data.current_turn = team1Data.finished && !team2Data.finished;
		}
		if(host) host.sendRoundUpdate(this.getUserData(host.getUniqueId()));
		for(let i = 0; i < playerIds.length; i++){
			var player = team1.getPlayerById(playerIds[i]);
			if(!player) player = team2.getPlayerById(playerIds[i]);
			if(player) player.sendRoundUpdate(this.getUserData(playerIds[i]));
		}
		if(team1Data.current_turn) team1Timer.resume();
		else if(team2Data.current_turn) team2Timer.resume();
	}
	
	this.endGame = function(){
		gameState.setState(states.END, {});
		if(host) host.sendStateUpdate(this.getUserData(host.getUniqueId()));
		for(let i = 0; i < playerIds.length; i++){
			var player = team1.getPlayerById(playerIds[i]);
			if(!player) player = team2.getPlayerById(playerIds[i]);
			if(player) player.sendStateUpdate(this.getUserData(playerIds[i]));
		}
	}
	
	this.backToLobby = function(){
		gameState.setState(states.LOBBY, {});
		if(host) host.sendStateUpdate(this.getUserData(host.getUniqueId()));
		for(let i = 0; i < playerIds.length; i++){
			var player = team1.getPlayerById(playerIds[i]);
			if(!player) player = team2.getPlayerById(playerIds[i]);
			if(player) player.sendStateUpdate(this.getUserData(playerIds[i]));
		}
	}
	
	this.newLobby = function(){
		for(let i = 0; i < playerIds.length; i++){
			var player = team1.getPlayerById(playerIds[i]);
			if(!player) player = team2.getPlayerById(playerIds[i]);
			if(player) player.disconnectUser();
			team1.removePlayer(playerIds[i]);
			team2.removePlayer(playerIds[i]);
		}
		playerIds = false;
		gameState.setState(states.LOBBY, {});
		if(host) host.sendStateUpdate(this.getUserData(host.getUniqueId()));
	}
	
	this.disconnectAll = function(){
		for(let i = 0; i < playerIds.length; i++){
			var player = team1.getPlayerById(playerIds[i]);
			if(!player) player = team2.getPlayerById(playerIds[i]);
			if(player) player.disconnectUser();
			team1.removePlayer(playerIds[i]);
			team2.removePlayer(playerIds[i]);
		}
		if(host) host.disconnectUser();
	}
	
	this.sendUpdates = function(user, params){
		//var summary = gameState.getSummary();
		//user.sendUpdates(summary, params);
	}
	
	setInterval(function(){
		if(gameState.get() != states.ROUND) return;
		const timeLeft = team1Data.current_turn ? team1Timer.getDigitalTime() : team2Data.current_turn ? team2Timer.getDigitalTime() : false;
		if(host && !(timeLeft === false)) host.sendTimeUpdate(timeLeft);
	}, 500);
}

function Team(){
	var players = {};
	var playerIds = false;
	var score = 0;
	
	this.addPlayer = function(player){
		var uniqueId = player.getUniqueId();
		if(typeof uniqueId === 'undefined' || !uniqueId) return;
		players[uniqueId] = player;
		if(playerIds) playerIds.push(uniqueId);
		else playerIds = [uniqueId];
	}
	
	this.getPlayerById = function(playerId){
		if(playerId in players) return players[playerId];
		else return false;
	}
	
	this.getPlayerByIndex = function(index){
		return playerIds ? players[playerIds[index]] : false;
	}
	
	this.removePlayer = function(playerId){
		if(!(playerId in players)) return;
		players[playerId] = false;
		if(playerIds.length > 1) playerIds = playerIds.filter(id => id != playerId);
		else playerIds = false;
	}
	
	this.getAll = function(){
		return players;
	}
	
	this.getPlayerCount = function(){
		return playerIds ? playerIds.length : 0;
	}
	
	this.resetScore = function(){
		score = 0;
	}
	
	this.addToScore = function(s){
		score += s;
	}
	
	this.getScore = function(){
		return score;
	}
}

function User(pSocket, pName){
	var socket = pSocket;
	
	this.getUniqueId = function(){
		if(socket && socket.handshake && socket.handshake.session && socket.handshake.session.unique_id) return socket.handshake.session.unique_id;
		return false;
	}
	
	if(socket && socket.handshake && socket.handshake.session){
		//if(typeof socket.handshake.session.unique_id === 'undefined'){
		//	console.log('# User connected.');
		//	socket.handshake.session.unique_id = socket.id;
		//}
		console.log('# User connected.');
		socket.handshake.session.unique_id = socket.id;
		
		socket.handshake.session.in_game = true;
		socket.handshake.session.user_id = this.getUniqueId();
		socket.handshake.session.save();
	}
	
	var isHost = !pName;
	var isPlayer = !isHost;
	var name = isPlayer ? pName : false;
	
	this.getHost = function(){
		return isHost;
	}
	
	this.getPlayer = function(){
		return isPlayer;
	}
	
	this.getName = function(){
		return name;
	}
	
	this.setGameId = function(gameId){
		socket.handshake.session.game_id = gameId;
	}
	
	this.updateSocket = function(pSocket){
		socket = pSocket;
	}
	
	this.disconnectUser = function(){
		socket.handshake.session.in_game = false;
		socket.handshake.session.unique_id = false;
		socket.handshake.session.user_id = false;
		socket.handshake.session.game_id = false;
		socket.handshake.session.save();
		if(isHost) socket.emit('host_init_nok');
		else socket.emit('game_init_nok');
	}
	
	this.sendTeamsUpdate = function(team1, team2){
		if(isHost) socket.emit('host_teams_update', {
			team1: team1,
			team2: team2
		});
	}
	
	this.sendLobbyUpdate = function(team){
		if(isPlayer) socket.emit('game_lobby_update', team);
	}
	
	this.sendStateUpdate = function(params){
		if(isHost) socket.emit('host_state_update', params);
		else if(isPlayer) socket.emit('game_state_update', params);
	}
	
	this.sendRoundUpdate = function(params){
		if(isHost) socket.emit('host_round_update', params);
		else if(isPlayer) socket.emit('game_round_update', params);
	}
	
	this.sendTimeUpdate = function(timeLeft){
		if(isHost) socket.emit('host_time_update', timeLeft);
	}
}

function Timer(seconds, oncomplete){
	var startTime;
	var timer;
	var milliseconds = seconds * 1000;
	var pMilliseconds = seconds * 1000;
	var started = false;
	var active = false;
	
	this.resume = function(){
		started = true;
		active = true;
		startTime = new Date().getTime();
		timer = setInterval(this.step, 250);
	}
	
	this.pause = function(){
		if(active){
			active = false;
			pMilliseconds = milliseconds;
			clearInterval(timer);
		}
	}
	
	this.step = function(){
		milliseconds = Math.max(0, pMilliseconds - (new Date().getTime() - startTime));
		if(milliseconds == 0){
			clearInterval(timer);
			active = false;
			if(oncomplete) oncomplete();
		}
	}
	
	this.reset = function(){
		this.pause();
		milliseconds = seconds * 1000;
		pMilliseconds = seconds * 1000;
		started = false;
	}
	
	this.getDigitalTime = function(){
		var min = Math.floor(milliseconds / 60000);
		var sec = Math.floor(milliseconds / 1000) % 60;
		return min + ":" + (sec < 10 ? "0" : "") + sec;
	}
	
	this.getSecondsLeft = function(){
		return Math.floor(milliseconds / 1000);
	}
}

function GameState(){
	var curState = false;
	var stateParams = false;
	var hiddenParams = false;
	
	this.get = function(){
		return curState;
	}
	
	this.setState = function(pState, pStateParams){
		curState = pState;
		stateParams = pStateParams;
	}
	
	this.setHiddenParams = function(pHiddenParams){
		hiddenParams = pHiddenParams;
	}
	
	this.getHiddenParams = function(){
		return hiddenParams;
	}
	
	this.getSummary = function(){
		var obj = {};
		obj.state = curState;
		obj.stateParams = stateParams;
		return obj;
	}
}