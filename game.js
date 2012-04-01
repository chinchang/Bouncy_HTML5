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
	// add a shine
	context.beginPath();
    context.fillStyle = "#df7c78";
    context.save();
    context.scale(1, 0.6);
	context.arc(0, -40, this.radius-20, 0, Math.PI*2, true);
	context.restore();
	context.fill();
	last_boundboxes.push({x: this.x - this.radius, y: this.y - this.radius, w: this.radius<<1, h: this.radius<<1});
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
		resetScore();
		emitParticles(5, {x: this.x, y: canvas.height - ground_height})
		this.speed_y = -this.speed_y * cor;

		// check if ball's speed is less than epsilon(very slow), make it rest
		if(Math.abs(this.speed_y * dt) < epsilon){
			this.speed_y = 0;
			this.y = canvas.height - ground_height - this.radius;
			this.is_on_floor = true;
			// save score only when ball is at rest
			if(supportsLocalStorage === true) saveScore();
		}
	}
}

Ball.prototype.containsPoint = function(x, y){
	var dx = this.x - x;
	var dy = this.y - y;
	return Math.sqrt(dx * dx + dy * dy) < this.radius;
}

Ball.prototype.clicked = function(cx, cy){
	this.speed_y = -1000;
	this.speed_x = (this.x- cx) / this.radius * 300;
	if(this.is_on_floor) this.is_on_floor = false;
}

/*
 * Shadow
 * @param	obj 	reference to an object to follow
 */
function Shadow(obj){ 
	this.x = 0;
	this.y = 0;
	this.scale_x = 1;
	this.scale_y = 0.3;
	this.object = obj;
}

Shadow.prototype.update = function(dt){
	this.x = this.object.x;
	this.y = canvas.height - ground_height;
	// shadow scale is inversely proportional to distance between
	// ball and shadow
	s_x =  1 - Math.abs(this.object.y + this.object.radius - this.y) / this.y;
	s_y =  s_x * 0.3;
	this.scale_x = s_x;
	this.scale_y = s_y;
},

Shadow.prototype.draw = function(context){
    context.fillStyle = "#305558";
	context.beginPath();
	context.arc(0, 0, this.object.radius, 0, Math.PI*2, true);
	context.closePath();
	context.fill();
	last_boundboxes.push({x: this.x - this.object.radius, y: this.y - this.object.radius * this.scale_y, w: (this.object.radius<<1) * this.scale_x, h: (this.object.radius<<1) * this.scale_y});
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
	this.radius = 3;
}

Particle.prototype.update = function(dt){
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
	context.arc(0, 0, this.radius, 0, Math.PI*2, true);
	context.fill();
	last_boundboxes.push({x: this.x - this.radius * this.scale_x, y: this.y - this.radius * this.scale_y, w: (this.radius<<1) * this.scale_x, h: (this.radius<<1) * this.scale_y});
}

function emitParticles(count, position){
	for(var i=count;i--;){
		addChild(new Particle(position.x - (Math.random() * 20 - 10), position.y, 50 - Math.random() * 100, -20 - Math.random() * 20));
	}
}

// GAME
var FPS = 60,
	canvas = null,
	ctx = null,
	buffer_canvas = null,
	buffer_canvas_ctx = null,
	game_objects = [],
	ground_height = 50;

var	gravity = 2000,
	epsilon = 0.5,
	cor = 0.7,
	friction = 0.9;

var score = 0,
	highscore = 0,
	last_time = 0,
	last_boundboxes = [],
	extra_boundary = 5,
	debug = 0,
	supportsLocalStorage = false;

var ball1, ball2;

window.addEventListener('load', init);

function init(e){
	averagefps = {x: 0, y: 0};
	canvas = document.getElementById("c");
	ctx = canvas.getContext('2d');
	buffer_canvas = document.createElement('canvas')
	buffer_canvas.width = canvas.width;
	buffer_canvas.height = canvas.height;
	buffer_canvas_ctx = buffer_canvas.getContext('2d');
	
	game_objects = [];

	// detect if the browser has localstorage support
	try{
		if(window['localStorage'] != null){
			supportsLocalStorage = true;
			if(!(highscore = window.localStorage.getItem('bouncy2score'))){
				highscore = 0;
				localStorage.setItem('bouncy2score', 0)
			}
		}
	} catch(e){
		supportsLocalStorage = false;
	}
	ball1 = new Ball();
	ball1.x = 420; 
	ball1.y = 80;

	addChild(ball1);

	ball2 = new Ball();
	ball2.x = 220; 
	ball2.y = 80;

	addChild(ball2);

	addChild(new Shadow(ball1));
	addChild(new Shadow(ball2));

	// fps text
	var fps_text = {
		x: 5,
		y: 15,
		fps: 0,
		update: function(dt){
			this.fps = Math.round(1/dt); 
			if(this.fps !== Infinity){
				averagefps.x = (averagefps.x * averagefps.y + this.fps) / ++averagefps.y; 
			}
		},

		draw: function(context){
			if(!debug) return;
			context.font = '12px Verdana';
    		context.fillStyle = '#FFF';
 			context.fillText(this.fps + ' fps', 0, 0);
 			last_boundboxes.push({x: this.x, y: this.y - 10, w: 50, h: 20});
		}
	};
	addChild(fps_text);

	// Entities text
	var entities_text = {
		x: 50,
		y: 15,
		draw: function(context){
			if(!debug) return;
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
 			last_boundboxes.push({x: this.x, y: this.y - 170, w: 120, h: 140});
		}
	};
	addChild(score_text);

	// highscore text
	var hscore_text = {
		x: 370,
		y: 110,
		draw: function(context){
			context.font = '40px Verdana';
    		context.fillStyle = 'rgba(255, 255, 255, 0.5)';
 			context.fillText(highscore, 0, 0);
 			last_boundboxes.push({x: this.x, y: this.y - 20, w: 40, h: 40});
		}
	};
	addChild(hscore_text);
	
	// bring balls forward in display list
	setChildIndex(ball1, game_objects.length - 1)
	setChildIndex(ball2, game_objects.length - 1)

	canvas.addEventListener('mousedown', onClick);
	canvas.addEventListener('keyup', onKeyUp);

	gameLoop();
}

function gameLoop(){
	update();
	draw();
	setTimeout(gameLoop, 1000/FPS);
}

function onKeyUp(e){ console.log(e);
	if(e.which == 32){
		debug ^= 1;
	}
}

function onClick(e){
	if(ball1.containsPoint(e.offsetX, e.offsetY)){
		score++;
		ball1.clicked(e.offsetX, e.offsetY);
	}
	else if(ball2.containsPoint(e.offsetX, e.offsetY)){
		score++;
		ball2.clicked(e.offsetX, e.offsetY);
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
			!isNaN(obj.x) && !isNaN(obj.y) && context.translate(obj.x, obj.y); 
			!isNaN(obj.scale_x) && !isNaN(obj.scale_y) && context.scale(obj.scale_x, obj.scale_y); 
			!isNaN(obj.alpha) && (context.globalAlpha = obj.alpha); 
			obj.draw(context);
			context.restore();
		}
	}
	ctx.drawImage(buffer_canvas, 0, 0);
}

function clearScreen(context, color){
    context.fillStyle = color;
    // context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    if(!last_boundboxes.length) 
    	context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    else{
    	// combine individual bounding boxes into one
    	var min = {x:canvas.width, y:canvas.height}, max = {x:0, y:0};
	    for (var i in last_boundboxes){
	    	var rect = last_boundboxes[i];
	    	if(rect.x < min.x) min.x = rect.x;
	    	if(rect.y < min.y) min.y = rect.y;
	    	if(rect.x + rect.w > max.x) max.x = rect.x + rect.w;
	    	if(rect.y + rect.h > max.y) max.y = rect.y + rect.h;
	    }	
    	context.strokeStyle = "#f00";
		context.beginPath();
		if(debug){
			context.rect(min.x - extra_boundary, min.y - extra_boundary, max.x-min.x+2*extra_boundary, max.y-min.y+2*extra_boundary);
			context.stroke();
		}
		else{
			context.fillRect(min.x - extra_boundary, min.y - extra_boundary, max.x-min.x+2*extra_boundary, max.y-min.y+2*extra_boundary);
			context.fill();
		}
	}
    last_boundboxes = [];
}

function addChild(c){
	game_objects.push(c);
}

function removeChild(c){
	for(var i=game_objects.length; i--;)
		if(game_objects[i] === c){
			delete c;
			game_objects.splice(i, 1);
			break;
		}
}

function setChildIndex(child, i){
	for(var j=-1, l=game_objects.length; ++j<l;){
		if(game_objects[j] === child && j != i){
			game_objects.splice(j, 1);
			game_objects.splice(i, 0, child);
		}
	}
}

function resetScore(){
	score > highscore ? highscore = score : null;
	score = 0;
}

function saveScore(){
	localStorage.setItem('bouncy2score', highscore);
}

})();
