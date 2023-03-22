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

function HostView(){
	var code = false;
	var state = false;
	var minPlayers = false;
	var maxPlayers = false;
	var team1 = false;
	var team2 = false;
	var round = false;
	var timeLeft1 = false;
	var timeLeft2 = false;
	var body1 = false;
	var body2 = false;
	
	this.init = function(){
		this.initSocket();
		this.bindViewEvents();
		this.bindSocketEvents();
		socket.emit('host_init');
	}
	
	this.initSocket = function(){
		socket = io.connect({
			'reconnection':true,
			'reconnectionDelay': 1000,
			'reconnectionDelayMax' : 1000,
			'reconnectionAttempts': 1000
		});
	}
	
	this.updateData = function(data){
		code = data.code;
		state = data.state;
		if(!minPlayers) minPlayers = data.min_players;
		if(!maxPlayers) maxPlayers = data.max_players;
		team1 = data.team1;
		team2 = data.team2;
		round = data.round;
		if(state == states.ROUND){
			timeLeft1 = team1.time_left;
			timeLeft2 = team2.time_left;
		}
		else if(state != states.ROUND_SCORES){
			timeLeft1 = false;
			timeLeft2 = false;
		}
		body1 = data.body1;
		body2 = data.body2;
		this.updateView();
	}
	
	this.updateView = function(){
		$("#room_code").html("Code: " + code);
		if(state == states.LOBBY){
			$("#lobby").show();
			$("#game_start").hide();
			$("#lobby_room_code").html("<p>Code: " + code + "</p>");
			var html1 = "<p>Team A:</p>";
			var html2 = "<p>Team B:</p>";
			if(team1 && team2 && team1.players && team2.players){
				const players1 = team1.players;
				for(let i = 0; i < maxPlayers; i++) html1 += "<p>" + (i < players1.length ? players1[i] : "<i>join now!</i>") + "</p>";
				const players2 = team2.players;
				for(let i = 0; i < maxPlayers; i++) html2 += "<p>" + (i < players2.length ? players2[i] : "<i>join now!</i>") + "</p>";
				const playerCount = players1.length + players2.length;
				if(playerCount < minPlayers * 2){
					$("#btn_start_game").html((minPlayers * 2 - playerCount) + (minPlayers * 2 - playerCount > 1 ? " more players needed" : " more player needed"));
					document.getElementById("btn_start_game").disabled = true;
				}
				else if(Math.abs(players1.length - players2.length) > 1){
					$("#btn_start_game").html("Unbalanced teams");
					document.getElementById("btn_start_game").disabled = true;
				}
				else{
					$("#btn_start_game").html('Start Game');
					document.getElementById("btn_start_game").disabled = false;
				}
			}
			else{
				for(let i = 0; i < maxPlayers; i++) html1 += "<p><i>join now!</i></p>";
				for(let i = 0; i < maxPlayers; i++) html2 += "<p><i>join now!</i></p>";
				$("#btn_start_game").html((minPlayers * 2) + " more players needed");
				document.getElementById("btn_start_game").disabled = true;
			}
			$("#lobby_team1").html(html1);
			$("#lobby_team2").html(html2);
		}
		else{
			$("#lobby").hide();
			$("#game_start").show();
			$("#game").show();
			if(state == states.INTRO){
				$("#intro").show();
				var html = "<p>Welcome to Switched at Mirth!</p><p>At the start of each round, each player has their brain put into the body of a teammate. The objective is to get each teammate's brain back into their own body before time runs out.</p><p>Each team has their own timer which ticks down on their respective turn. On your team's turn, you will be shown on your device whose body your brain is currently in. You must use your combined information to figure out how to complete your task.</p><p>For each round, one player per team is the captain. During your team's turn, your captain chooses two bodies and the brains inside them will be swapped. Once a swap is made, your team's timer pauses and play carries over to the other team (unless they have finished or run out of time). However, the captain does not know whose body their own brain is in.</p>" + (team1.players.length != team2.players.length ? "<p>" + (team1.players.length > team2.players.length ? "Team A" : "Team B") + " has an extra player. One random player from their team will be on the bench each round.</p>" : "");
				$("#intro").html(html);
			}
			else if(state == states.ROUND_INTRO){
				$("#intro").show();
				$("#intro").html((round == 0 ? "<p>ROUND 1</p>" : round == 1 ? "<p>ROUND 2</p>" : "<p>FINAL ROUND</p><p>Points are doubled this round.</p>") + (team1.turn ? "<p>Team A is going first this round.</p>" : team2.turn ? "<p>Team B is going first this round.</p>" : "") + "<p>Team A's captain is: " + team1.captain + "</p><p>Team B's captain is: " + team2.captain + ".</p>" + (team1.bench ? "<p>" + team1.bench + " is on the bench.</p>" : team2.bench ? "<p>" + team2.bench + " is on the bench.</p>" : "") + "<p>The timer will start as soon as the host clicks 'Continue'.</p>");
			}
			else $("#intro").hide();
			if(state == states.ROUND){
				$("#round").show();
				var html = "";
				var team = false;
				var timeLeft;
				if(team1.turn){
					$("#btn_continue").hide();
					html = "<p>Team A</p>";
					team = team1;
					timeLeft = timeLeft1;
				}
				else if(team2.turn){
					$("#btn_continue").hide();
					html = "<p>Team B</p>";
					team = team2;
					timeLeft = timeLeft2;
				}
				else{
					$("#btn_continue").show();
					html += "<p>Team A: " + (timeLeft1 == "0:00" ? "did not finish" : "finished with " + timeLeft1 + " remaining") + "</p><p>Team B: " + (timeLeft2 == "0:00" ? "did not finish" : "finished with " + timeLeft2 + " remaining") + "</p>";
				}
				if(team) html += "<p>Time Left: " + timeLeft + "</p><p>Swapping:</p>" + (body1 === false ? "<p><i>none selected</i></p>" : "<p>" + team.players[body1] + "</p>") + (body2 === false ? "<p><i>none selected</i></p>" : "<p>" + team.players[body2] + "</p>");
				$("#round").html(html);
			}
			else{
				$("#round").hide();
				$("#btn_continue").show();
			}
			if(state == states.ROUND_SCORES){
				$("#scores").show();
				const minPlayers = Math.min(team1.players.length, team2.players.length);
				$("#scores").html("<p>SCORES</p><div><p>Team A:</p><p>Clear Players: " + team1.clear_players + "/" + minPlayers + "</p><p>Clear Bonus: " + team1.clear_bonus + "</p>" + (team1.clear_players == minPlayers ? "<p>Time Left: " + timeLeft1 + "</p><p>Time Bonus: " + team1.time_bonus + "</p><p>Moves: " + team1.moves + "</p><p>Move Bonus: " + team1.move_bonus + "</p>" : "") + "<p>Round Total: " + team1.round_score + "</p></div><div><p>Team B:</p><p>Clear Players: " + team2.clear_players + "/" + minPlayers + "</p><p>Clear Bonus: " + team2.clear_bonus + "</p>" + (team2.clear_players == minPlayers ? "<p>Time Left: " + timeLeft2 + "</p><p>Time Bonus: " + team2.time_bonus + "</p><p>Moves: " + team2.moves + "</p><p>Move Bonus: " + team2.move_bonus + "</p>" : "") + "<p>Round Total: " + team2.round_score + "</p></div>");
			}
			else if(state == states.SCORES){
				$("#scores").show();
				$("#scores").html("<p>SCORES</p><p>Team A: " + team1.total_score + "</p><p>Team B: " + team2.total_score + "</p>");
			}
			else $("#scores").hide();
			if(state == states.WINNER){
				$("#winner").show();
				var html = "<p>WINNERS</p>";
				if(team1.total_score >= team2.total_score){
					html += "<p>TEAM A:</p>";
					const players = team1.players;
					for(let i = 0; i < players.length; i++) html += "<p>" + players[i] + "</p>";
				}
				if(team1.total_score <= team2.total_score){
					html += "<p>TEAM B:</p>";
					const players = team2.players;
					for(let i = 0; i < players.length; i++) html += "<p>" + players[i] + "</p>";
				}
				$("#winner").html(html);
			}
			else $("#winner").hide();
			if(state == states.END){
				$("#game").hide();
				$("#end").show();
				$("#final_scores").html("<p>FINAL SCORES</p><p>Team A: " + team1.total_score + "</p><p>Team B: " + team2.total_score + "</p>");
			}
			else $("#end").hide();
		}
	}
	
	this.bindViewEvents = function(){
		$('#btn_start_game').click(function(){
			if(!team1 || !team2 || !team1.players || !team2.players) alert(minPlayers * 2 + " more players needed to start.");
			else{
				const playerCount = team1.players.length + team2.players.length;
				if(playerCount < minPlayers * 2) alert((minPlayers * 2 - playerCount) + (minPlayers * 2 - playerCount > 1 ? " more players needed to start." : " more player needed to start."));
				else if(Math.abs(team1.players.length - team2.players.length) > 1) alert("Teams cannot have a size difference of more than 1 player.");
				else if(confirm("Start the game?")) socket.emit('host_start_game');
			}
			return false;
		});
		$('#btn_continue').click(function(){
			socket.emit('host_continue');
			return false;
		});
		$('#btn_end_game').click(function(){
			socket.emit('host_end_game');
			return false;
		});
		$('#btn_leave_game').click(function(){
			if(confirm("Destroy the current game? All data associated with this game will be lost.")) socket.emit('host_leave_game');
			return false;
		});
		$('#btn_same_teams').click(function(){
			if(confirm("Play again with the same teams?")) socket.emit('host_start_game');
			return false;
		});
		$('#btn_new_teams').click(function(){
			if(confirm("Play again with new teams? All players will remain connected.")) socket.emit('host_back_to_lobby');
			return false;
		});
		$('#btn_new_players').click(function(){
			if(confirm("Start a new lobby? You as the host will remain connected.")) socket.emit('host_new_lobby');
			return false;
		});
	}
	
	this.bindSocketEvents = function(){
		socket.on('host_init_ok', function(host){
			return function(data){
				host.updateData(data);
				return false;
			}
		}(this));
		socket.on('host_init_nok', function(){
			location.href = '/';
		});
		socket.on('host_teams_update', function(host){
			return function(data){
				if(state != states.LOBBY) return false;
				team1 = data.team1;
				team2 = data.team2;
				host.updateView();
				return false;
			}
		}(this));
		socket.on('host_state_update', function(host){
			return function(data){
				if(state != data.state) host.updateData(data);
				return false;
			}
		}(this));
		socket.on('host_round_update', function(host){
			return function(data){
				if(state == states.ROUND) host.updateData(data);
				return false;
			}
		}(this));
		socket.on('host_time_update', function(host){
			return function(timeLeft){
				if(state != states.ROUND) return false;
				else if(team1.turn) timeLeft1 = timeLeft;
				else if(team2.turn) timeLeft2 = timeLeft;
				host.updateView();
				return false;
			}
		}(this));
	}
}

$(document).ready(function(){
	var game = new HostView();
	game.init();
});