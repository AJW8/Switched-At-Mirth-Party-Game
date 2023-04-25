# Switched-At-Mirth-Party-Game

## A local server-based party team game built using Node.js and Socket.IO.

This project was built from my previous party game template at https://github.com/AJW8/Party-Game-Template.

### Host
- Each game has a single host whose screen must be publically displayed at all times.
- During a game, press 'Continue' to move to the next state. This controls the flow of the game, except during the actual rounds where it is governed by timers.
- After a game, press 'Same Teams' to restart the game, press 'New Teams' to return to the lobby with all players still connected, or press 'New Players' to disconnect all players and start a new lobby.
- At any time, press 'Leave Game' to disconnect all users from the current game.
- Currently, the presentation is very bare-bones as I'm no visual designer.  Feel free to copy this project and improve the graphics.

### Player
- Once a game has been created, users can join as a player by entering the matching room code displayed on the host's screen.
- Before the start of the game, each player is assigned a team.  They can change teams if they wish.
- Both teams actively compete against each other to win by ending up with the highest score.
- The player view is exclusive to the player and should not be shown to anyone else.
- Each round, one player per team is the captain.  The captain has full control over decision-making while it is their team's turn.
- If a team has an extra player, they will have one player on the bench each round.
- Whichever players are neither captains nor on the bench will be shown all relevant information while it is their team's turn.

### Project Setup
After downloading and unzipping the GIT folder, you will need to install dependencies before you can play.  You can do so with the following command:
```
npm install
```

### Preferences
The root folder contains a prefs.json file for customising preferences.  These include:
- The password required to host a game.
- The minimum number of players required on each team to start a game (must be at least 3, preferably 4).
- The maximum number of players that can be on a team (preferably 6).
You may also add your own preferences e.g. enable audience, hide code.

### Local Server
Run the local server with the following command:
```
node app.js
```

### Creating a new game
- Go to http://localhost:3000 on your web browser
- Under the 'Create Game' heading, enter the correct password then click 'Create'
- You will be taken to the host page, where you will be shown the room code and the lobby
- Once enough players have joined and the teams are 'balanced' (size difference of no more than 1 player), you may start the game whenever you are ready

### Joining a game
- First make sure you are connected to the same wifi network as the host
- Go to http://******:3000 on your web browser, replacing ****** with the host's IPv4 address
- Under the 'Join Game' heading, enter your desired name and the matching room code then click 'Connect'
- You will be taken to the game page, where you can choose a team (one is pre-selected for you) while waiting for the host to start the game
