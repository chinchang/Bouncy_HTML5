/*
Copyright (c) 2012 Kushagra Gour (chinchang457@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
;(function(){


// BALL
function Ball(){
	this.x = 0;
	this.y = 0;
	this.speed_x = 0;
	this.speed_y = 0;
	this.radius = 40;
	this.is_on_floor = false;
}

Ball.prototype.draw = function(context){
	context.strokeStyle = "#BBB";
    context.fillStyle = "#FFF";
	context.beginPath();
	context.arc(0, 0, this.radius, 0, Math.PI*2, true);
	context.closePath();
	context.fill();
	context.stroke();
}

Ball.prototype.update = function(dt){
	// apply gravity on the ball
	if(!this.is_on_floor)
		this.speed_y += gravity * dt;
	else{
		this.speed_x *= friction;
		if(Math.abs(this.speed_x * dt) < epsilon) this.speed_x = 0;
	}
	// move the ball
	this.x += this.speed_x * dt;
	this.y += this.speed_y * dt;

	// check for wall and ball collisions
	var cond1 = this.x + this.radius > canvas.width;
	var cond2 = this.x - this.radius < 0;
	if(cond1) this.x = canvas.width - this.radius;
	if(cond2) this.x = this.radius;
	if(cond1 || cond2)
		this.speed_x = -this.speed_x;
	if(this.y + this.radius + this.speed_y * dt > canvas.height){ 
		score = 0;
		this.speed_y = -this.speed_y * cor;
		if(Math.abs(this.speed_y * dt) < epsilon){
			this.speed_y = 0;
			this.y = canvas.height - this.radius;
			this.is_on_floor = true;
			console.log('on floor');
		}
	}
}

Ball.prototype.containsPoint = function(x, y){
	var dx = this.x - x;
	var dy = this.y - y;
	return Math.sqrt(dx * dx + dy * dy) < this.radius;
}

// GAME
var FPS = 60;
var canvas = null;
var ctx = null;
var buffer_canvas = null;
var buffer_canvas_ctx = null;
var game_objects = [];


var ball;
var gravity = 2000;
var epsilon = 0.5;
var cor = 0.7;
var friction = 0.9;

var score = 0;
var last_time = 0;

window.addEventListener('load', init);

function init(e){
	canvas = document.getElementById("c");
	ctx = canvas.getContext('2d');
	buffer_canvas = document.createElement('canvas')
	buffer_canvas.width = canvas.width;
	buffer_canvas.height = canvas.height;
	buffer_canvas_ctx = buffer_canvas.getContext('2d');
	
	game_objects = [];

	canvas.strokeStyle = "#000";

	ball = new Ball();
	ball.x = ball.y = 80;

	addChild(ball);

	// fps text
	var fps_text = {
		x: 5,
		y: 15,
		fps: 0,
		update: function(dt){
			this.fps = Math.round(1/dt);
		},

		draw: function(context){
			context.font = '12px Verdana';
    		context.fillStyle = '#CCC';
 			context.fillText(this.fps + ' fps', 0, 0);
		}
	};
	addChild(fps_text);

	// score text
	var score_text = {
		x: 260,
		y: 250,
		draw: function(context){
			context.font = '240px Verdana';
    		context.fillStyle = 'rgba(255, 255, 255, 0.5)';
 			context.fillText(score, 0, 0);
		}
	};
	addChild(score_text);

	canvas.addEventListener('mousedown', onClick);

	gameLoop();
}

function gameLoop(){
	update();
	draw();
	setTimeout(gameLoop, 1000/FPS);
}

function onClick(e){
	if(ball.containsPoint(e.offsetX, e.offsetY)){
		score++;
		ball.speed_y = -800;
		ball.speed_x = 600 - Math.random() * 1200;
		if(ball.is_on_floor) ball.is_on_floor = false;
	}
}

/*
Game's update function called from gameloop
Updates all game entities
*/
function update(){
	// get the time past the previous frame
	var current_time = new Date().getTime();
	if(!last_time) last_time = current_time;
	var dt = (current_time - last_time) / 1000;
	last_time = current_time;

	for(var i = 0; i < game_objects.length; i++){
		var obj = game_objects[i];
		if(typeof obj.update == 'function'){
			obj.update(dt);
		}
	}
}

/*
Game's draw function called from gameloop
Draws all game entities
*/
function draw(){
	clearScreen(buffer_canvas_ctx, '#EEE');
	// use double buffering technique to remove flickr :)
	var context = buffer_canvas_ctx;
	for(var i = 0; i < game_objects.length; i++){
		var obj = game_objects[i];
		if(typeof obj.draw == 'function'){
			context.save();
			context.translate(obj.x, obj.y); 
			obj.draw(context); 
			context.restore();
		}
	}
	ctx.drawImage(buffer_canvas, 0, 0);
}

function clearScreen(context, color){
    context.fillStyle = color;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
}

function addChild(c){
	game_objects.push(c);
}



})();