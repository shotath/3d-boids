(function ( window ) {
	var MAX_SPEED = 1000; // MAX_SPEED (px/s)
	var BOID_WIDTH = 7;
	var BOID_HEIGHT = 7;
	var MIN_DISTANCE = (BOID_WIDTH + BOID_HEIGHT)*2;
	var INITIAL_BOIDS_LENGTH = 10;
	var PREFIX = getPrefix();
	var TRANSFORM = PREFIX === '' ? 'transform' : PREFIX + 'Transform';

	var currentBoidsLength = 0;
	var boids = [];
	var world = document.getElementById('world');
	var worldWidth, worldHeight, worldDipth;
	var rules = {};
	var counter = document.getElementById('counter');
	var fps = document.getElementById('fps');
	var wallBottom = document.getElementById('wall-bottom');
	var wallOpposite = document.getElementById('wall-opposite');

	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame;
	var startTime_ms, previousTime_ms;
	var fpsCollections = [];

	function getPrefix() {
		var userAgent = window.navigator.userAgent.toLowerCase();
		var prefix;
		if ( userAgent.indexOf('msie') != -1 ) {
			prefix = 'ms';
		}
		else if ( userAgent.indexOf('chrome') != -1 || userAgent.indexOf('safari') != -1 || userAgent.indexOf('opera') != -1 ) {
			prefix = 'webkit';
		}
		else if ( userAgent.indexOf('gecko') != -1 ) {
			prefix = 'Moz';
		}
		else {
			prefix = '';
		}
		return prefix;
	}

	function setupWorld( isUpdate ) {
		worldWidth = document.documentElement.clientWidth;
		worldHeight = document.documentElement.clientHeight;
		worldDipth = worldWidth;

		world.style.width = worldWidth + 'px';
		world.style.height = worldHeight + 'px';
		wallBottom.style[TRANSFORM] = 'rotateX(-90deg) translateZ(' + worldHeight + 'px)';
		wallOpposite.style[TRANSFORM] = 'translateZ(-' + worldDipth + 'px)';
		
		if ( isUpdate ) return;

		world.style.position = 'relative';
		world.style[TRANSFORM + 'Style'] = 'preserve-3d';
		world.style[TRANSFORM] = 'perspective(800px)';
	}

	function addBoids( num ) {
		var boid, posX, posY, posZ;
		var colors =['#2c3e50', '#2980b9', '#c0392b', '#e67e22', '#27ae60', '#f39c12'];
		for (var i = num-1; i >= 0; i--) {
			posX = Math.floor( Math.random() * worldWidth+1 ) - BOID_WIDTH;
			posY = Math.floor( Math.random() * worldHeight+1 ) - BOID_HEIGHT;
			posZ = Math.floor( Math.random() * worldDipth+1 ) - worldDipth;

			boid = document.createElement( 'boid' );
			boid.className = 'boid';
			boid.style[TRANSFORM] = 'translate3d(' + posX + 'px, ' + posY + 'px, ' + posZ + 'px)';
			boid.style.width = BOID_WIDTH + 'px';
			boid.style.height = BOID_HEIGHT + 'px';
			boid.style.backgroundColor = colors[Math.floor( Math.random() * colors.length )];

			world.appendChild( boid );
			boids[boids.length] = {
				target: boid,
				x: posX, // px
				y: posY, // px
				z: posZ, // px
				vx: posY*0.5,   // (px/s)
				vy: posZ*0.5,   // (px/s)
				vz: posX*0.5,   // (px/s)
				tempDis: 0,
				beenApplidNeighborsRule: false
			};
			currentBoidsLength++;
		}
		counter.innerHTML = currentBoidsLength + '<span>Boids</span>';
	}

	function getDistance( b1, b2 ) {
		var x = b1.x - b2.x;
		var y = b1.y - b2.y;
		var z = b1.z - b2.z;
		return Math.sqrt( x*x + y*y + z*z );
	}

	rules.goesToCenter = function (index) {
		var center = {
			x:0,
			y:0,
			z:0
		};
		for ( var i = currentBoidsLength - 1; i >= 0; i-- ) {
			if ( i === index ) continue;
			center.x += boids[i].x;
			center.y += boids[i].y;
			center.z += boids[i].z;
		}
		center.x /= currentBoidsLength - 1;
		center.y /= currentBoidsLength - 1;
		center.z /= currentBoidsLength - 1;

		boids[index].vx += (center.x - boids[index].x) / 2;
		boids[index].vy += (center.y - boids[index].y) / 2;
		boids[index].vz += (center.z - boids[index].z) / 2;
	}

	rules.keepsDistance = function ( index ) {
		var distance;
		for ( var i = currentBoidsLength - 1; i >= 0; i-- ) {
			if ( i === index ) continue;
			distance = getDistance( boids[i], boids[index] );

			if ( distance < MIN_DISTANCE ) {
				boids[index].vx -= ( boids[i].x - boids[index].x );
				boids[index].vy -= ( boids[i].y - boids[index].y );
				boids[index].vz -= ( boids[i].z - boids[index].z );
			}
		}
	}
	rules.movesSameSpeed = function ( index ) {
		var avarageVelocity = {
			vx:0,
			vy:0,
			vz:0
		};
		for ( var i = currentBoidsLength - 1; i >= 0; i-- ) {
			if ( i === index ) continue;
			avarageVelocity.vx += boids[i].vx;
			avarageVelocity.vy += boids[i].vy;
			avarageVelocity.vz += boids[i].vz;
		}
		avarageVelocity.vx /= currentBoidsLength - 1;
		avarageVelocity.vy /= currentBoidsLength - 1;
		avarageVelocity.vz /= currentBoidsLength - 1;

		boids[index].vx += (avarageVelocity.vx - boids[index].vx) / 40;
		boids[index].vy += (avarageVelocity.vy - boids[index].vy) / 40;
		boids[index].vz += (avarageVelocity.vz - boids[index].vz) / 40;
	}

	function updateFps( interval_ms ) {
		var loopCount = fpsCollections.length;
		fpsCollections[fpsCollections.length] = Math.floor( 1000/interval_ms );
		loopCount++;
		if ( loopCount%30 === 0 ) {
			var aveFps = 0;
			for (var i = loopCount - 1; i >= 0; i--) {
				aveFps += fpsCollections[i];
			}
			aveFps /= loopCount;
			fps.innerHTML = Math.round( aveFps ) + '<span>FPS</span>';
			fpsCollections = [];
		}
	}

	function boidLoop() {
		var currentTime_ms = new Date().getTime();
		var interval_ms = currentTime_ms - previousTime_ms;
		previousTime_ms = currentTime_ms;

		updateFps( interval_ms );
		
		for ( var i = currentBoidsLength - 1; i >= 0; i-- ) {
			var boid = boids[i];
			var speed;
			var time_sec = interval_ms / 1000;

			// apply rules
			// -------------------------
			rules.goesToCenter( i );
			rules.keepsDistance( i );
			rules.movesSameSpeed( i );

			// speed check
			// -------------------------
			speed = Math.sqrt( boid.vx*boid.vx + boid.vy*boid.vy + boid.vz*boid.vz );
			if ( speed > MAX_SPEED ) {
				var r = MAX_SPEED / speed;
				boid.vx *= r;
				boid.vy *= r;
				boid.vz *= r;
			}
			
			// manage world range
			// -------------------------
			if ( ( boid.x < 0 && boid.vx < 0 ) || ( boid.x > worldWidth - BOID_WIDTH && boid.vx > 0 ) ) {
				boid.vx *= -1;
			}
			else if ( ( boid.x < worldWidth*0.1 && boid.vx < 0 ) || ( boid.x > worldWidth*0.9 - BOID_WIDTH && boid.vx > 0 ) ) {
				boid.vx *= 0.9;
			}

			if ( (  boid.y < 0 && boid.vy < 0 ) || ( boid.y > worldHeight - BOID_HEIGHT && boid.vy > 0 ) ) {
				boid.vy *= -1;
			}
			else if ( ( boid.y < worldHeight*0.1 && boid.vy < 0 ) || ( boid.y > worldHeight*0.9 - BOID_HEIGHT && boid.vy > 0 ) ) {
				boid.vy *= 0.9;
			}

			if ( ( boid.z < -worldDipth && boid.vz < 0 ) || ( boid.z > 0 && boid.vz > 0 ) ) {
				boid.vz *= -1;
			}
			else if ( ( boid.z < -worldDipth*0.9 && boid.vz < 0 ) || ( boid.z > -worldDipth*0.1 && boid.vz > 0 ) ) {
				boid.vz *= 0.9;
			}
			
			// cast x y z
			// -------------------------
			boid.x += boid.vx * time_sec;
			boid.y += boid.vy * time_sec;
			boid.z += boid.vz * time_sec;
			boids[i] = boid;

			// apply params to boid
			// -------------------------
			boid.target.style[TRANSFORM] = 'translate3d(' + boids[i].x + 'px, ' + boids[i].y + 'px, ' + boids[i].z + 'px)';
			boid.target.style.opacity = 1.2 + ( boids[i].z / worldDipth );
		}
		window.requestAnimationFrame( boidLoop );
	}



	window.onload = function ( e ) {
		setupWorld();
		if ( INITIAL_BOIDS_LENGTH < 3 ) INITIAL_BOIDS_LENGTH = 3;
		addBoids( INITIAL_BOIDS_LENGTH );
		startTime_ms = new Date().getTime();
		previousTime_ms = startTime_ms;
		window.requestAnimationFrame = requestAnimationFrame;
		window.requestAnimationFrame( boidLoop );
	}
	window.onresize = function ( e ) {
		setupWorld( 'isUpdate' );
	}
	window.onclick = function ( e ) {
		addBoids( 1 );
	}

})( window );