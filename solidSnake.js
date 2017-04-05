var SOLIDSNAKE = (function () {
    var FPS = 50
    var GAME_WIDTH = 1400, GAME_HEIGHT = 800, BORDER_THICKNESS = 40;
    var player_colors = ['#f8f8f8', '#3591d0', '#f57650', '#ffa517', '#5d7c02',"#00ffff", 'yellow']
    var global_pressed_keys = [];
    var players = []

    // module aliases
    var Engine = Matter.Engine,
        Runner = Matter.Runner,
        Render = Matter.Render,
        Composites = Matter.Composites,
        Common = Matter.Common,
        MouseConstraint = Matter.MouseConstraint,
        Mouse  = Matter.Mouse,
        World  = Matter.World,
        Body = Matter.Body,
        Bodies = Matter.Bodies,
        Events = Matter.Events;

    window.addEventListener('keydown', function (e) {
        global_pressed_keys[e.keyCode] = true;
    })

    window.addEventListener('keyup', function (e) {
        global_pressed_keys[e.keyCode] = false;
    })

    // create an engineœ
    var engine = Engine.create();
    var world  = engine.world;
    world.gravity.y = 0;

    var canvas = document.getElementById('canvas1');
    // create a renderer
    var render = Render.create({
        element: document.body,
        engine: engine,
        canvas: canvas,
        options: {
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                showVelocity: false, //dev indicator
                showAngleIndicator: false, //dev indicator
                wireframes: false
            }
    });

    // add borders
    var createWorldBorders = function(){
        World.add(world, [
            Bodies.rectangle(0, GAME_HEIGHT/2, BORDER_THICKNESS, GAME_HEIGHT,            { isStatic: true }),
            Bodies.rectangle(GAME_WIDTH, GAME_HEIGHT/2, BORDER_THICKNESS, GAME_HEIGHT,   { isStatic: true }),
            Bodies.rectangle(GAME_WIDTH/2, 0, GAME_WIDTH, BORDER_THICKNESS,              { isStatic: true }),
            Bodies.rectangle(GAME_WIDTH/2, GAME_HEIGHT, GAME_WIDTH, BORDER_THICKNESS,    { isStatic: true }),
        ]);
    }


    function Snake(x,y,color,playerNumber){
        this.x = x
        this.y = y
        this.initAngle = 0
        this.initialPos = {x:x, y:y}
        this.headRadius = 15
        this.color = color
        this.velocity = 10
        this.fireRate = 4
        this.fireAvailable = true
        this.killable = true;
        this.life = 5
        this.isAlive = this.life > 0
        this.playerNumber = playerNumber

        this.keys = [37,38,39,40] //LEFT, UP, RIGHT, DOWN

        this.headBody = Bodies.circle(this.x, this.y, this.headRadius,
                        {render: { fillStyle: this.color }})

        this.snakeBody = createSnakeBody(this.life, this.color, this.group)

        this.group = Body.nextGroup(true);

        this.loseLife = function(){
            this.snakeBody.bodies.splice(0, 1)
            this.snakeBody.constraints.splice(0, 1)
            this.killable = false
            if(this.life > 0) {this.life--}
            else{
                this.velocity = 0
                this.isAlive = false
                this.headBody.render.fillStyle = "grey"
            }
            triggerKillable(this)
        }

        this.gainLife = function(){
            //no possibility to gain life for now in the game
        }

        this.resetSnake = function(){
            //clear old body
            World.remove(world, this.snakeBody)
            //re-init
            this.setPosition(this.initialPos, this.initAngle)

            this.life = 5
            this.isAlive = true
            this.snakeBody = createSnakeBody(this.life, this.color, this.group)
            World.add(world, this.snakeBody)

            attachHeadToBody(this.headBody, this.snakeBody)
            resetPlayerColor(this)
        }

        this.setPosition = function(pos, angle){
            Body.setAngle(this.headBody, angle);
            Body.setPosition(this.headBody, {x: pos.x, y: pos.y})
        }

        this.move = function(){
            var velx = this.velocity*Math.cos(this.headBody.angle)
            var vely = this.velocity*Math.sin(this.headBody.angle)
            Body.setVelocity(this.headBody, {x:velx, y:vely})
        }

        this.create = function (playerNumber){
            this.headBody.label = "Player" + playerNumber
            if(playerNumber === 3 || playerNumber === 2) {
                this.initAngle = -Math.PI
                Body.rotate(this.headBody,this.initAngle)
            }
            this.headBody.friction = 0
            this.headBody.frictionStatic = 1
            this.headBody.frictionAir = 0.0
            Body.setMass(this.headBody, 100)
            Body.setInertia(this.headBody, Infinity)
            World.add(world, this.headBody)

            attachHeadToBody(this.headBody, this.snakeBody)

            World.add(world, this.snakeBody)
        }

        this.listenKeyboard = function(){
            var keys = this.keys, hb = this.headBody
            for(var k in keys){
                if(global_pressed_keys[keys[k]] && this.isAlive){
                    switch(keys[k]){
                        case this.keys[0]:
                            Body.setAngle(hb,hb.angle - 0.1);
                            break;
                        case this.keys[2]:
                            Body.setAngle(hb,hb.angle + 0.1);
                            break;
                        case this.keys[1]:
                            this.fire();
                            break;
                        case this.keys[3]:
                            if(this.killable) {
                                this.loseLife();
                            }
                            break;
                    }
                }
            }
        }

        this.fire = function(){
            if(this.fireAvailable){
                var hb = this.headBody
                var pr = new Projectile(hb.position.x,hb.position.y,
                         hb.angle, 10, this.color)
                setTimeout(function(){ World.remove(world, pr.body) },pr.lifeTime)
                this.reloadProjectile(this, 1000/this.fireRate)
            }
        }

        this.reloadProjectile =function(obj,time){
            this.fireAvailable = false;
            setTimeout(function(){obj.fireAvailable = true}, time)
        }

         function createSnakeBody(numberOfBodies, color, bodyGroup){
            var snakeBody = Matter.Composite.create()
            for(var i = 0; i < numberOfBodies; i++){
                var bod = Bodies.circle(x-i*50, y+i*10, 10, { collisionFilter: { group: bodyGroup } });
                Body.setInertia(bod, Infinity)
                Body.setMass(bod, 0.001)
                bod.friction = 0
                bod.frictionStatic = 0
                bod.frictionAir = 0.1
                bod.label = "SnakeBody"
                bod.render.fillStyle = 'black'
                bod.render.strokeStyle = color
                bod.render.lineWidth  = 7
                Matter.Composite.add(snakeBody,bod)
            }
            Composites.chain(snakeBody, 0, 0, 0, 0, { stiffness: 1, length: 20 , render: {visible: false} });
            return snakeBody;
        };

        function attachHeadToBody(head, snakeBody){
            Matter.Composite.add(snakeBody, Matter.Constraint.create({
                   bodyA: snakeBody.bodies[snakeBody.bodies.length-1],
                   bodyB: head,
                   pointA: { x:   0, y: 0 },
                   pointB: { x: -15*Math.cos(head.angle), y: 0 },
                   stiffness: 1,
                   length:11,
                   render: {visible: false}
            }));
        }
    }

    function Projectile(x,y,angle,velocity,color){
        this.x = x
        this.y = y
        this.radius = 8
        this.velocity = velocity
        this.distFromGun = 40
        this.angle = angle
        this.color = color
        this.lifeTime = 1000
        this.body = Bodies.circle((this.x)+this.distFromGun*Math.cos(this.angle),
                      (this.y) + this.distFromGun*Math.sin(this.angle), this.radius,
                      {render: { fillStyle: this.color }})
        //
        this.body.label = "Projectile"
        Body.setMass(this.body,1000)
        Body.setVelocity(this.body,{x:15*Math.cos(this.angle),y:15*Math.sin(this.angle)});
        World.add(world, this.body);

    }

    function Obstacle(x,y,w,h,fixed){
        this.x = x
        this.y = y
        this.width  = w
        this.height = h
        this.static = fixed
        this.label  = "default"
        this.body   = Bodies.rectangle(this.x, this.y, this.width, this.height, {isStatic: this.static})

        this.generateRandomPosition = function(){
            this.x =      Math.floor(Math.random() * (GAME_WIDTH  - BORDER_THICKNESS ))
            this.y =      Math.floor(Math.random() * (GAME_HEIGHT + BORDER_THICKNESS ))
            this.width  = Math.random() * 100
            this.height = Math.random() * 400
            this.static = Math.round(Math.random())

            if(this.x-this.width/2 < BORDER_THICKNESS) {
                this.x = BORDER_THICKNESS + this.width/2
            }
            if(this.x+this.width/2 > GAME_WIDTH - BORDER_THICKNESS) {
                this.x =  GAME_WIDTH - BORDER_THICKNESS - this.width/2
            }
            if(this.y-this.height/2 < BORDER_THICKNESS) {
                this.y = BORDER_THICKNESS + this.height/2
            }
            if(this.y+this.height/2 > GAME_HEIGHT-BORDER_THICKNESS) {
                this.y = GAME_HEIGHT - BORDER_THICKNESS - this.height/2
            }

            this.body = Bodies.rectangle(this.x, this.y, this.width, this.height)

            if(this.static){
                this.body.isStatic = true;
                this.body.render.fillStyle = 'grey'
            }
        }

        this.addToWorld = function(){
            World.add(world, this.body)
        }

        this.removeFromWorld = function(){
            World.remove(world, this.body)
        }


    }

    Events.on(engine, 'collisionStart', function(event) {
            var pairs = event.pairs;

            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i];
                if(pair.bodyA.label.includes("Player")){
                    if(pair.bodyB.label === "Projectile"){
                        pair.bodyA.render.fillStyle = 'pink';
                        processCollidedPlayer(players, pair.bodyA)
                    }
                }
                if(pair.bodyB.label.includes("Player")){
                    if(pair.bodyA.label === "Projectile"){
                        pair.bodyB.render.fillStyle = 'pink';
                        processCollidedPlayer(players, pair.bodyB)
                    }
                }

                if(pair.bodyA.label === "Projectile") World.remove(world, [pair.bodyA])
                if(pair.bodyB.label === "Projectile") World.remove(world, [pair.bodyB])
            }
    });

    function triggerKillable(obj){
        setTimeout(function(){obj.killable = true}, 1000)
    }

    function processCollidedPlayer(players, body){
        for(var p = 0; p < players.length ; p++) {
            if(players[p].headBody.label === body.label){
                if(players[p].killable){
                    players[p].loseLife()
                    setTimeout(function(param){
                        resetPlayerColor(param)
                    }, 1000, players[p])
                }
            }
        }
    }
    function resetPlayerColor(player){
        if(player.isAlive) player.headBody.render.fillStyle = player.color;
        else player.headBody.render.fillStyle = 'grey'
    }


    function Game(){
        // this.players = players
        this.nbPlayers = 0;
        this.winner = undefined;
        this.lastRoundWinner = undefined;
        this.scoreLimit = 3; //matches number
        this.gameLoop = undefined;
        this.gameRunning = false;
        this.playersScores = [0,0,0,0]

        this.startScreenDelay = 5000
        this.startScreenRemainingDelay = 5000
        this.startScreenDisplayed = false
        this.roundEnded = false

        this.randomObstacles = []

        this.initGame = function(playerNumber){
            if(playerNumber > 4) playerNumber = 4 //MAX VALUE
            player_colors = ['#f8f8f8', '#3591d0', '#f57650', '#ffa517', '#5d7c02',"#00ffff", 'yellow']

            for(var i=0; i < playerNumber; i++){
                if(i===0) this.addPlayer(300  ,200,[],i+1) // NO player 0
                if(i===1) this.addPlayer(1100 ,600,[81,90,68,83], i+1)  // Q,Z,D,S
                if(i===3) this.addPlayer(300  ,600,[97,101,99,98],i+1) // NUMPAD
                if(i===2) this.addPlayer(1100 ,200,[74,73,76,75] ,i+1)  // J,I,K,L
            }

            //add borders to the game area
            createWorldBorders();
            //fixed center CROSS
            var o1 = new Obstacle(GAME_WIDTH/2,GAME_HEIGHT/2,GAME_HEIGHT/3, BORDER_THICKNESS, true);
            var o2 = new Obstacle(GAME_WIDTH/2,GAME_HEIGHT/2,BORDER_THICKNESS, GAME_HEIGHT/3, true);
            World.add(world, [o1.body,o2.body])
        }

        this.addPlayer = function(x,y,controls, playerNumber){
            var newpl = new Snake(x,y, this.generateRandomColor(), playerNumber)
            if(controls.length === 4) newpl.keys = controls
            this.nbPlayers++
            newpl.create(this.nbPlayers)
            players.push(newpl)
        }

        var updatePlayers = function(){
            for(var i=0; i < players.length; i++){
                players[i].listenKeyboard()
                players[i].move()
            }
        }

        this.startGame = function(){
            if(!this.gameRunning){
                //start rendering the game
                this.startRendering()

                if(!this.startScreenDisplayed){
                    this.initRound()
                }
                //run the game engine and players update
                this.gameLoop = setInterval(function(gameInstance) {
                    updatePlayers()
                    gameInstance.computeScores()
                    Engine.update(engine, 1000 / FPS);
                }, 1000 / FPS, this);
                this.gameRunning = true;
            }
        }

        this.stopGame = function(){
            if(this.gameRunning){
                this.gameRunning = false
                this.startScreenDisplayed = false
                this.playersScores = [0,0,0,0]
                //stop gameLoop
                clearInterval(this.gameLoop)
                //stop the rendering
                this.stopRendering()
                SOLIDSNAKE_UI.displayMenu(render.context);
            }
        }

        this.startNewGame = function(nbPlayers){
            this.stopGame()
            this.clearGame()
            this.initGame(nbPlayers)
            this.startGame()
        }

        this.clearGame = function(){
            World.clear(world)
            this.nbPlayers = 0
            this.winner = undefined
            players = []
        }

        this.startRendering = function(){
            Render.run(render);
        }

        this.stopRendering = function(){
            Render.stop(render);
        }

        this.addRandomObstacle= function(){
            var obst = new Obstacle();
            obst.label = "randomObst"
            obst.generateRandomPosition();
            obst.addToWorld();
            this.randomObstacles.push(obst)
        }

        this.initRound = function(){
            this.roundEnded = false
            for(var i = 0; i < players.length; i++) {
                players[i].velocity = 0
                players[i].killable = false
                players[i].life = 5
                players[i].isAlive = 5
            }

            this.addRandomObstacle();
            this.addRandomObstacle();
            this.addRandomObstacle();
            this.addRandomObstacle();

            var timeout = setTimeout(function(obj){
                obj.startScreenDisplayed = true
                for(var i = 0; i < players.length; i++){
                    players[i].velocity = 10
                    players[i].killable = true
                }
            }, this.startScreenDelay, this)

            var self = setInterval(function(obj){
                obj.startScreenRemainingDelay -= 1000
                if(obj.startScreenRemainingDelay <= 0){
                    obj.startScreenRemainingDelay = obj.startScreenDelay
                    clearInterval(self) //stop count
                }
            }, 1000, this)
        }

        this.endRound = function(){
            //cleaning random obstacles
            for(var i = 0; i < this.randomObstacles.length; i++){
                this.randomObstacles[i].removeFromWorld()
            }

            this.randomObstacles = []
            this.startScreenDisplayed = false

            for(var i = 0; i < players.length; i++){
                players[i].resetSnake()
            }

            this.initRound()
        }

        this.generateRandomColor = function(){
            var r = Math.floor(Math.random()*player_colors.length)
            var color = player_colors[r];
            player_colors.splice(r,1)
            return color;
        }

        this.setScoreLimit = function(limit){
            this.scoreLimit = limit;
        }

        this.computeScores = function(){
            var aliveCpt = 0, lastAliveFoundIndex = 0;
            for(var i = 0; i < players.length; i++){
                if(players[i].isAlive){
                    aliveCpt++;
                    lastAliveFoundIndex = i;
                }
            }
            if(aliveCpt === 1 && !this.roundEnded) { //round is over
                this.playersScores[lastAliveFoundIndex] += 1;
                this.roundEnded = true
                this.lastRoundWinner = players[lastAliveFoundIndex]
                if(this.playersScores[lastAliveFoundIndex] >= this.scoreLimit){
                    this.winner = players[lastAliveFoundIndex]
                    setTimeout(function(obj){obj.stopGame()},4000, this)
                }
                // trigger 4 seconds waiting before new round
                setTimeout(function(obj){obj.endRound()},4000, this)
            }
        }

    }

    Events.on(render, "afterRender", function(){
        if(!gameLauncher.startScreenDisplayed){ //starting counter screen
            SOLIDSNAKE_UI.displayStartScreen(render.context, players, GAME_WIDTH, GAME_HEIGHT)
        }
        else{
            if(gameLauncher.winner !== undefined){
                SOLIDSNAKE_UI.displayEndScreen(render.context, gameLauncher.winner, "matchEnd")
            }
            else if(gameLauncher.roundEnded){
                SOLIDSNAKE_UI.displayEndScreen(render.context, gameLauncher.lastRoundWinner, "roundEnd")
            }
        }
        SOLIDSNAKE_UI.displayPlayerScores(render.context, players, gameLauncher.playersScores)
    });



    var gameLauncher = new Game()

    //GAME MODULE RETURN
    return {
        GAME_WIDTH: GAME_WIDTH,
        GAME_HEIGHT: GAME_HEIGHT,
        BORDER_THICKNESS: BORDER_THICKNESS,
        players: players,
        gameLauncher: gameLauncher
    }
})();
