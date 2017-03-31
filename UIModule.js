var SOLIDSNAKE_UI = (function() {

    var canvas = document.getElementById("canvas1");
    var canvasCtx = canvas.getContext("2d")
    var canvasCenter = {x: canvas.width/2, y: canvas.height/2}
    var isDisplayed = false;
    var uiLoop =  undefined

    var mouse = {x: 0, y: 0, clicked: false, down: false}
    canvas.addEventListener('mousemove', getPosition, false);
    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('click', onClick, false);

    function getPosition(event)
    {
      var x, y;
      if (event.x != undefined && event.y != undefined)
        {
          x = event.x;
          y = event.y;
        }
        else // Firefox method to get the position
        {
            //scroll are not 0 when scrollbars are visible
            //put them just in case game is zoomed
          x = event.clientX + document.body.scrollLeft +
              document.documentElement.scrollLeft;
          y = event.clientY + document.body.scrollTop +
              document.documentElement.scrollTop;
        }

      x -= canvas.offsetLeft;
      y -= canvas.offsetTop;
      mouse.x = x;
      mouse.y = y;
    }

    function onMouseDown(event){
        mouse.clicked = false;
        mouse.down = true;
    }

    function onClick(event){
        mouse.down = false;
        mouse.clicked = true;
        setTimeout(function(){mouse.clicked = false}, 100)
    }

    var UIObject = function(x,y,w,h, color){
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.defaultColor = color;
        this.hoverColor = "#3366ff"
        this.pressedColor = "#3333ff"
        this.hovered = false;
        this.pressed = false;
        this.clicked = false;
        this.text = ""
        this.textSize = 28
        this.textColor = 'white'

        var roundedRectangle = function(x,y,w,h,radius, ctx){
            ctx.beginPath();
            ctx.strokeStyle = "white";
            ctx.lineWidth = "8";
            ctx.moveTo(x+radius,y);
            ctx.lineTo(x+w-radius, y);
            ctx.quadraticCurveTo(x+w, y, x+w, y+radius);
            ctx.lineTo(x+w, y+h-radius)
            ctx.quadraticCurveTo(x+w, y+h, x+w-radius, y+h);
            ctx.lineTo(x+radius, y+h);
            ctx.quadraticCurveTo(x, y+h, x, y+h-radius);
            ctx.lineTo(x, y+radius);
            ctx.quadraticCurveTo(x, y, x+radius, y);
            ctx.stroke();
            ctx.fill()
        }

        this.intersectsWithMouse = function(){
            var t = 5, //pixels tolerance
            xIntersects = (mouse.x >= this.x - t) && (mouse.x <= this.x + this.width  + t),
            yIntersects = (mouse.y >= this.y - t) && (mouse.y <= this.y + this.height + t);
            return (xIntersects && yIntersects);
        }

        this.draw = function(){
            if(this.hovered){
                if(this.pressed) canvasCtx.fillStyle = this.pressedColor
                else canvasCtx.fillStyle = this.hoverColor
            }
            else {
                canvasCtx.fillStyle = this.defaultColor
            }
            roundedRectangle(this.x,this.y,this.width,this.height, 15, canvasCtx)

            if(this.text != "" && this.text != undefined){
                this.printCenteredText(this.text)
            }
        }

        this.update = function(){
            if(this.intersectsWithMouse()){
                this.hovered = true
                if(mouse.down){
                    this.pressed = true
                }
                if(mouse.clicked){
                    this.clicked = true
                }
                // else {
                //     this.pressed = false
                // }
            }
            else{
                this.hovered = false
                this.pressed = false
                this.clicked = false
            }
        }

        this.printCenteredText = function(text){
            canvasCtx.fillStyle = this.textColor
            canvasCtx.font = this.textSize + 'px monospace'
            var tx = this.x + (this.width - canvasCtx.measureText(this.text).width)/2,
            ty = this.y + (this.height)/2
            canvasCtx.fillText(text, tx, ty)
        }
    }

    function printText(text, x, y, color, pxSize, ctx){
        ctx.fillStyle = color
        ctx.font = pxSize + 'px monospace';
        ctx.fillText(text, x, y)
    }

    function displayStartScreen(ctx, players){
        var GAME_WIDTH = SOLIDSNAKE.GAME_WIDTH
        var GAME_HEIGHT = SOLIDSNAKE.GAME_HEIGHT

        ctx.fillStyle = 'black'
        ctx.globalAlpha = 0.4
        ctx.fillRect(GAME_WIDTH/6,GAME_HEIGHT/6,GAME_WIDTH*2/3,GAME_HEIGHT*2/3)

        ctx.globalAlpha = 1
        ctx.fillStyle = players[0].color
        ctx.font = "24px monospace"

        var margin = 50
        var playerInfoArray = [{}, {}, {}, {}]
        //Player1
        playerInfoArray[0].info = "UP,LEFT,RIGHT,DOWN"
        playerInfoArray[0].x =  GAME_WIDTH/6 + margin
        playerInfoArray[0].y = GAME_HEIGHT/6 + margin
        //Player2
        playerInfoArray[1].info = "Z,Q,S,D"
        playerInfoArray[1].x = 5/6 * GAME_WIDTH  - margin - ctx.measureText(playerInfoArray[1].info).width
        playerInfoArray[1].y = 5/6 * GAME_HEIGHT - margin
        //Player3
        playerInfoArray[2].info = "I,J,K,L"
        playerInfoArray[2].x = 5/6 * GAME_WIDTH  - margin - ctx.measureText(playerInfoArray[3].info).width
        playerInfoArray[2].y = GAME_HEIGHT/6 + margin
        //Player4
        playerInfoArray[3].info = "5,1,2,3"
        playerInfoArray[3].x = GAME_WIDTH/6 + margin
        playerInfoArray[3].y = 5/6 * GAME_HEIGHT  - margin

        for(var i = 0; i < players.length; i++){
            ctx.fillStyle = players[i].color
            ctx.fillText(playerInfoArray[i].info, playerInfoArray[i].x, playerInfoArray[i].y)
        }

        ctx.font = "82px mono"
        ctx.fillStyle = 'red'
        ctx.fillText(SOLIDSNAKE.gameLauncher.startScreenRemainingDelay/1000,GAME_WIDTH/2, GAME_HEIGHT/2)
    }

    var  buttonDefaultColor = 'grey'
    var playButton = new UIObject(550,350,300,200 ,  '#00d07a')
    var p2 = new UIObject(20,  400 ,100,100,  buttonDefaultColor); p2.text = '2p';
    var p3 = new UIObject(140, 400 ,100,100,  buttonDefaultColor); p3.text = "3p";
    var p4 = new UIObject(260, 400, 100,100,  buttonDefaultColor); p4.text = "4p";

    playButton.text = "Play Game";
    playButton.textSize = 48;

    var gameTitle = "[ Solid Snake ]"
    var playerNumberStr = "Number of Players :"

    uiObjects = []
    uiObjects.push(playButton, p2,p3,p4)

    var nbPlayers = 2, lastPressedIndex = 0;
    function selectNumberOfPlayers(buttons){
        for(var i=0; i < buttons.length; i++){
            if(buttons[i].clicked) lastPressedIndex = i;
            if(i === lastPressedIndex){
                nbPlayers = i+2;
                buttons[i].defaultColor = buttons[i].hoverColor;
            }
            else{
                buttons[i].defaultColor = 'grey'
            }
        }
    }

    // draw the main menu to the canvas
    function draw(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for(var i=0; i < uiObjects.length; i++){
            uiObjects[i].draw()
        }

        printText(playerNumberStr, 30, 350, 'white', 28, ctx)
        ctx.font = 48 + 'px monospace';
        printText(gameTitle, canvasCenter.x-(ctx.measureText(gameTitle).width)/2 , canvasCenter.y/3, 'white', 48, ctx)
    }

    function update() {
        for(var i=0; i < uiObjects.length; i++){
            uiObjects[i].update()
        }

        selectNumberOfPlayers([p2,p3,p4])

        if(playButton.clicked){
            closeUI();
            SOLIDSNAKE.gameLauncher.startNewGame(nbPlayers)
        }
    }

    var closeUI = function(){
        if(isDisplayed){
            clearInterval(uiLoop)
            isDisplayed = false
        }
    }

    var displayUI = function(ctx){
        canvas = ctx.canvas;
        canvasCenter.x = canvas.width/2; canvasCenter.y = canvas.height/2;
        if(!isDisplayed){
                uiLoop = setInterval(function(ctx){
                    update();
                    draw(ctx);
                }, 1000/60, ctx)
                isDisplayed = true;
        }
    }

    // this is the object that will be `startScreen`
    return {
        displayStartScreen: displayStartScreen,
        closeUI: closeUI,
        displayUI: displayUI
    }

}());
