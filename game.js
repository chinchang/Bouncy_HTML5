/*
Copyright (c) 2012 Kushagra Gour (chinchang457@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
;(function(){


/* 
 * Ball
 */
function Ball(){
	this.x = 0;
	this.y = 0;
	this.speed_x = 0;
	this.speed_y = 0;
	this.radius = 40;
	this.is_on_floor = false;
}

Ball.prototype.draw = function(context){
	context.strokeStyle = "#000";
    context.fillStyle = "#D5544F";
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
	
	// if ball touched ground
	if(this.y + this.radius + this.speed_y * dt > canvas.height - ground_height){ 
		score = 0;
		emitParticles(5, {x: this.x, y: canvas.height - ground_height})
		this.speed_y = -this.speed_y * cor;
		if(Math.abs(this.speed_y * dt) < epsilon){
			this.speed_y = 0;
			this.y = canvas.height - ground_height - this.radius;
			this.is_on_floor = true;
		}
	}
}

Ball.prototype.containsPoint = function(x, y){
	var dx = this.x - x;
	var dy = this.y - y;
	return Math.sqrt(dx * dx + dy * dy) < this.radius;
}

/*
 * Particle
 * @param	x 	position of particle on x axis
 * @param	y 	position of particle on y axis
 * @param	sx 	speed of particle on x axis
 * @param	sy 	speed of particle on x axis
 */
function Particle(x, y, sx, sy){
	this.alpha = 1;
	this.x = x;
	this.y = y;
	this.alpha = 1;
	this.speed_x = sx;
	this.speed_y = sy;
	this.scale_x = 1;
	this.scale_y = 1;
}

Particle.prototype.update = function(dt){
	//this.speed_y += gravity * dt;
	this.x += this.speed_x * dt;
	this.y += this.speed_y * dt;
	this.scale_x += 6 * dt;
	this.scale_y += 6 * dt;
	this.alpha -= 1.5 * dt;
	if(this.alpha <= 0)
		removeChild(this);
}

Particle.prototype.draw = function(context){
    context.fillStyle = "#bdd8db";
	context.beginPath();
	context.arc(0, 0, 3, 0, Math.PI*2, true);
	context.fill();
}

function emitParticles(count, position){
	for(var i=count;i--;){
		addChild(new Particle(position.x - (Math.random() * 20 - 10), position.y, 50 - Math.random() * 100, -20 - Math.random() * 20));
	}
}

// GAME
var FPS = 60;
var canvas = null;
var ctx = null;
var buffer_canvas = null;
var buffer_canvas_ctx = null;
var game_objects = [];
var ground_height = 50;

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
	ball.x = 320; 
	ball.y = 80;

	addChild(ball);

	// ball shadow
	var ball_shadow = {
		x: 0,
		y: 0,
		scale_x: 1,
		scale_y: 0.3,
		update: function(dt){
			this.x = ball.x;
			this.y = canvas.height - ground_height;
			// shadow scale is inversely proportional to distance between
			// ball and shadow
			s_x =  1 - Math.abs(ball.y + ball.radius - this.y) / this.y;
			s_y =  s_x * 0.3;
			this.scale_x = s_x;
			this.scale_y = s_y;
		},

		draw: function(context){
		    context.fillStyle = "#305558";
			context.beginPath();
			context.arc(0, 0, ball.radius, 0, Math.PI*2, true);
			context.closePath();
			context.fill();
		}
	};
	addChild(ball_shadow);

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
    		context.fillStyle = '#FFF';
 			context.fillText(this.fps + ' fps', 0, 0);
		}
	};
	addChild(fps_text);

	// Entities text
	var entities_text = {
		x: 50,
		y: 15,
		draw: function(context){
			context.font = '12px Verdana';
    		context.fillStyle = '#FFF';
 			context.fillText(game_objects.length + ' Entities', 0, 0);
		}
	};
	addChild(entities_text);


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
	
	// bring ball forward in display list
	setChildIndex(ball, game_objects.length - 1)

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
 * Game's update function called from gameloop
 * Updates all game entities
 */
function update(){
	// get the time past the previous frame
	var current_time = new Date().getTime();
	if(!last_time) last_time = current_time;
	var dt = (current_time - last_time) / 1000;
	last_time = current_time;

	for(var i = game_objects.length; i--;){
		var obj = game_objects[i];
		if(typeof obj.update == 'function'){
			obj.update(dt);
		}
	}
}

/*
 * Game's draw function called from gameloop
 * Draws all game entities
 */
function draw(){
	clearScreen(buffer_canvas_ctx, '#9CC5C9');
	// use double buffering technique to remove flickr :)
	var context = buffer_canvas_ctx;
	for(var i = 0, l = game_objects.length; i < l; i++){
		var obj = game_objects[i];
		if(typeof obj.draw == 'function'){
			context.save();
			if(!(isNaN(obj.x) || isNaN(obj.y))) context.translate(obj.x, obj.y); 
			if(!(isNaN(obj.scale_x) || isNaN(obj.scale_y))) context.scale(obj.scale_x, obj.scale_y); 
			if(!isNaN(obj.alpha)) context.globalAlpha = obj.alpha; 
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

function removeChild(c){
	for(var i=0, l=game_objects.length; i<l; i++)
		if(game_objects[i] === c){
			delete c;
			game_objects.splice(i, 1);
			break;
		}
}

function setChildIndex(child, i){
	for(var j=0, l=game_objects.length; j<l; j++){
		if(game_objects[j] === child && j != i){
			game_objects.splice(j, 1);
			game_objects.splice(i, 0, child);
		}
	}
}


})();
