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

function GameView(){
	var state = false;
	var name = false;
	var team = false;
	var teammates = false;
	var captain = false;
	var bench = false;
	var body = false;
	var turn = false;
	var body1 = false;
	var body2 = false;
	var finished = false;
	
	this.init = function(){
		this.initSocket();
		this.bindViewEvents();
		this.bindSocketEvents();
		socket.emit('game_init');
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
		state = data.state;
		if(!name) name = data.name;
		team = data.team;
		teammates = data.teammates;
		captain = data.captain;
		bench = data.bench;
		body = data.body;
		turn = data.turn;
		if(captain && turn){
			body1 = data.body1;
			body2 = data.body2;
		}
		else{
			body1 = false;
			body2 = false;
		}
		finished = data.finished;
		this.updateView();
	}
	
	this.updateView = function(){
		$("#title").html("<b>" + (name ? name : "") + (team === false ? "" : team == 0 ? " (Team A)" : " (Team B)") + "</b>");
		$("#bench").hide();
		var idle = true;
		if(state == states.LOBBY){
			idle = false;
			$("#lobby").show();
			document.getElementById("btn_lobby_team1").disabled = team == 0;
			document.getElementById("btn_lobby_team2").disabled = !(team === false) && team != 0;
		}
		else $("#lobby").hide();
		if(state == states.ROUND_INTRO){
			if(bench === true){
				idle = false;
				$("#first").hide();
				$("#bench").show();
			}
			else if(turn){
				idle = false;
				$("#first").show();
			}
			else $("#first").hide();
		}
		else $("#first").hide();
		if(state == states.ROUND && !finished){
			idle = false;
			if(bench === true) $("#bench").show();
			else{
				if(!turn) $("#waiting").show();
				else $("#waiting").hide();
				if(!(captain === true) && turn){
					$("#not_captain").show();
					$("#not_captain").html("<p>" + teammates[captain] + " is your team's captain. Work with your team to get everyone's brains back into their own bodies!</p><p>" + (body === true ? "Your brain is currently in your own body." : "Your brain is currently in this player's body: " + teammates[body]) + "</p>");
				}
				else $("#not_captain").hide();
				if(captain === true && turn){
					$("#captain").show();
					for(let i = 0; i < teammates.length; i++){
						const div = $("#captain_body" + (i + 1));
						if(bench === false || i != bench){
							div.show();
							$("#btn_body" + (i + 1)).html(teammates[i]);
							$("#label_body" + (i + 1)).html(!(body1 === false) && i == body1 || !(body2 === false) && i == body2 ? "Selected" : "");
							document.getElementById("btn_body" + (i + 1)).disabled = !(body1 === false) && !(body2 === false) && i != body1 && i != body2;
						}
						else div.hide();
					}
					for(let i = teammates.length + 1; i < 7; i++) $("#captain_body" + i).hide();
					document.getElementById("btn_swap_bodies").disabled = body1 === false || body2 === false;
				}
				else $("#captain").hide();
			}
		}
		else{
			$("#waiting").hide();
			$("#not_captain").hide();
			$("#captain").hide();
		}
		if(state == states.END){
			idle = false;
			$("#end").show();
		}
		else $("#end").hide();
		if(idle) $("#idle").show();
		else $("#idle").hide();
	}
	
	this.bindViewEvents = function(){
		$('#btn_lobby_team1').click(function(){
			if(team != 0) socket.emit('game_lobby_change_team');
			return false;
		});
		$('#btn_lobby_team2').click(function(){
			if(team === false || team == 0) socket.emit('game_lobby_change_team');
			return false;
		});
		$('#btn_body1').click(function(){
			socket.emit('game_captain_select_body', 0);
			return false;
		});
		$('#btn_body2').click(function(){
			socket.emit('game_captain_select_body', 1);
			return false;
		});
		$('#btn_body3').click(function(){
			socket.emit('game_captain_select_body', 2);
			return false;
		});
		$('#btn_body4').click(function(){
			socket.emit('game_captain_select_body', 3);
			return false;
		});
		$('#btn_body5').click(function(){
			socket.emit('game_captain_select_body', 4);
			return false;
		});
		$('#btn_body6').click(function(){
			socket.emit('game_captain_select_body', 5);
			return false;
		});
		$('#btn_swap_bodies').click(function(){
			if(!(body1 === false || body2 === false)) socket.emit('game_captain_swap_bodies');
			return false;
		});
	}
	
	this.bindSocketEvents = function(){
		socket.on('game_init_ok', function(game){
			return function(data){
				game.updateData(data);
				return false;
			}
		}(this));
		socket.on('game_init_nok', function(){
			alert('You were disconnected.');
			location.href = '/';
		});
		socket.on('game_lobby_update', function(game){
			return function(newTeam){
				if(state == states.LOBBY){
					team = newTeam;
					game.updateView();
				}
				return false;
			}
		}(this));
		socket.on('game_state_update', function(game){
			return function(data){
				if(state != data.state) game.updateData(data);
				return false;
			}
		}(this));
		socket.on('game_round_update', function(game){
			return function(data){
				if(state == states.ROUND) game.updateData(data);
				return false;
			}
		}(this));
	}
}

$(document).ready(function(){
	var game = new GameView();
	game.init();
});