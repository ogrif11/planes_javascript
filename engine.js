var engine;

var output_debug_messages = true;
if(typeof(engine) == "undefined"){
	if(init_engine(output_debug_messages)){
		engine.debug("Init passed: " + engine.initialised);
		var options = [];
		engine.prepare_simulation(options);
		//loop begins
		engine.run_simulation();
	}else{
		alert("Init failed.");
	}
}
function init_engine(debug){
	engine = {};
	engine.debug_enabled = false;
	engine.initialised = true;
	engine.gameTime = 0;
	engine.callbacks = {};
	engine.callbacks.logging_callback = false; //allocate a function to call it on log.
	engine.callbacks.new_jobs_callback = false;
	engine.callbacks.plane_status_changed = false;
	if(debug){
		engine.debug_enabled = true;
		console.log("Debugger enabled.");
	}
	
	engine.debug = function(message, severity){
		if(!this.debug_enabled){
			return;
		}
		if(typeof(severity) == "undefined"){
			severity = "0";
		}
		var outputstring = "";
		if(severity > 0){
			outputstring = convert_severity(severity) + ": " + message;
		}else{
			outputstring = message;
		}
		if(typeof(console) != "undefined"){

			console.log(outputstring);
			if(severity > 0){
				if(engine.debug_enabled){force_breakpoint();}
			}
		}
		if(typeof(engine.callbacks.logging_callback) == "function"){
			engine.callbacks.logging_callback(outputstring);
		}
	};
	engine.prepare_simulation = function(state_object){
		if(isArray(state_object)){
			//make a 'new game' state.
				var new_game_args = state_object;
				engine.state_object = engine.get_new_state_object(new_game_args);
				engine.debug("Loaded a new game state.");
		}
		else if(typeof(state_object) == "object"){
			//do some sort of checking and assign to state
			if(engine.check_state_object(state_object)){
				engine.state_object = state_object;
			}else{
				engine.debug("state object could be corrupt.");
			}
		}else{
			engine.debug("Could not work out game state object - expected object to resume or array of options",2);
		}

		return true;
	};
	engine.run_simulation = function(){
		t=setInterval(function(){engine.tick();},30);
	};
	engine.tick = function(){
		var logic_run_wait_time = 1000; //ms
		var state = engine.state_object;
			var now = new Date();
		engine.gameTime = now.getTime();
		if(state.metadata.last_logic_run < engine.gameTime - logic_run_wait_time){
			//TODO: Is it ok for simulation to continue if game is paused?

			var currentDate = now.getSeconds();
			//engine.debug("tick: Has been " + (logic_run_wait_time/10) + "/100s since last run.. " + currentDate);
			
				{
				//TODO: Refactor away.

					//check for arrivals
					var p = engine.state_object.planes;

					p.forEach(function(plane){
								var ap = lookup.lookup_airport_by_id(plane.next_airport_id);
								plane.next_airport_object = ap;
						var prev_status = plane.status;
						if(plane.arrives_at < engine.gameTime){
							if(plane.arrives_at > 0){
								engine.debug("Plane " + plane.id + " is landing at " + ap.name + " (arrival time " + plane.arrives_at + ")");
								plane.arrives_at = 0;
								//plane is landing - pay player cash.
								if(plane.jobs_onboard.length > 0){
									plane.jobs_onboard.forEach(function(job){

									});//each jobs
									for(var i=plane.jobs_onboard.length-1; i >=0;i--){
										var job = plane.jobs_onboard[i];
										if(job.destination == ap.id){
											engine.debug("unloading " + job.type + " " + job.name + " for " + job.cash_payment);
											engine.state_object.money +=job.cash_payment;
											plane.jobs_onboard.splice(i,1);
										}
									}
								}
								plane.status = "landing";
								plane.position = plane.next_airport_object.position;
								if(typeof(engine.callbacks.plane_status_changed) == "function" && plane.status != prev_status){
									engine.callbacks.plane_status_changed(plane);
								}
							}else{
								plane.status = "grounded";
								plane.position = plane.next_airport_object.position;
								if(typeof(engine.callbacks.plane_status_changed) == "function" && plane.status != prev_status){
									engine.callbacks.plane_status_changed(plane);
								}
							}
						}else{
								plane.status = "enroute";
								plane.position = lookup.lookup_estimate_plane_position(plane);
								if(typeof(engine.callbacks.plane_status_changed) == "function"){
									engine.callbacks.plane_status_changed(plane);
								}
						}
						if(plane.jobs_onboard.length > 0){
							plane.jobs_onboard.forEach(function(job){
								//engine.debug("-- With " + job.type + " " + job.name + " onboard.");
							});
						}
					}); //each plane

					//is it time to generate jobs?
					if(engine.state_object.next_job_generate < engine.gameTime){
						//time to generate new jobs.
							
						engine.generate_jobs();
						engine.state_object.next_job_generate = engine.gameTime + engine.state_object.job_generate_wait_time;
						if(typeof(engine.callbacks.new_jobs_callback) == "function"){engine.callbacks.new_jobs_callback();}
					}
				}
			state.metadata.last_logic_run = now.getTime();
		}
	};
	engine.generate_jobs = function(){
		var people_first_names = ['Amy','Joanna','Kirstee','Michelle','Simon','Ben','Melanie','George','Ann','Hanna','Craig','Chris','Elizabeth','Suzanne','Georgina','Patricia','Victoria','Zana','Hilary','Dorothy','Judy','Kim','Esther','Gitta','Giha','Lyn','Glenda','Ann','Janette','Joyce','Leah'];
		var people_last_names = ['Brown','Smith','Jones','Williams','Jackson','White','Black','Gray'];
		var cargo_names = ['Cups','Bottles','Boxes','Phones','Mice','Keyboards','Monitors','USB Sticks','Wallets','Staplers','Labels','Paper','iPhones','Signs'];
		var jobs = [];
		var i;
		var job;
		//for each airport from
							var from_airports = engine.state_object.airports;
							from_airports.forEach(function(from_airport){
								//make a list of airports to.
								var to_airports = engine.state_object.airports;
								to_airports.forEach(function(to_airport){

									if(to_airport.id !== from_airport.id){
										var people_jobs_to_generate = from_airport.sizeMillions * to_airport.sizeMillions * 0.07 * getRandomInt(0,3);
										var cargo_jobs_to_generate = from_airport.sizeMillions * to_airport.sizeMillions * 0.07 * getRandomInt(0,3);
										var flight_distance = lookup.get_distance(from_airport.position, to_airport.position);
											
										for(i = 0; i < people_jobs_to_generate;i++){
											var fn = people_first_names[Math.floor(Math.random()*people_first_names.length)];
											var ln = people_last_names[Math.floor(Math.random()*people_last_names.length)];
											engine.state_object.metadata.jobs_created +=1;
											job = {"taken":false,"start_airport":from_airport.id, "id":engine.state_object.metadata.jobs_created,"type":"people",name:fn + " " + ln,gender:"NA",cash_payment:lookup.lookup_flight_retail_cost(flight_distance),destination:to_airport.id};
											engine.state_object.jobs.push(job);
										}
										for(i = 0; i < cargo_jobs_to_generate;i++){
											var cargoname = cargo_names[Math.floor(Math.random()*cargo_names.length)];
											engine.state_object.metadata.jobs_created +=1;
											job = {"taken":false,"start_airport":from_airport.id, "id":engine.state_object.metadata.jobs_created,"type":"cargo",name:cargoname,gender:"NA",cash_payment:lookup.lookup_flight_retail_cost(flight_distance),destination:to_airport.id};
											engine.state_object.jobs.push(job);
										}
									}
								}); //to
							}); //from
			engine.force_ui_update();
	};
	engine.check_state_object = function(state_object){
		//TODO: Sanity check state object
		engine.debug("Checking game state object.");
		return true;
	};
	engine.get_new_state_object = function(args){
		//TODO: Return new game state object.
		engine.debug("Making a new game state object.");
		var game_state = {};
		game_state.airports = [];
		game_state.planes = [];
		game_state.metadata = {};
		var a = game_state.airports;
		a.push({"id":1,"name":"Sydney","sizeMillions":5,"activated":false,"jobs":[],position:{latitude:-33.946884,longitude:151.181359}});
		a.push({"id":2,"name":"Brisbane","sizeMillions":2,"activated":false,"jobs":[],position:{latitude:-27.392498,longitude:153.116455}});
		a.push({"id":3,"name":"Adelaide","sizeMillions":2,"activated":false,"jobs":[],position:{latitude:-34.948498,longitude:138.530817}});
		var ps = game_state.planes;
		var p = {"id":1,"model":"Cessna","speed":3,"jobs_onboard":[],"itinerary":[],status:"",next_airport_id:1,takeoff_time:0,position:{},"last_airport_object":{},"next_airport_object":a[0],"arrives_at":0,"capacity_people":2,"capacity_cargo":0};
		ps.push(p);
		var now = new Date();
		var q = {"id":2,"model":"Cessna","speed":3,"jobs_onboard":[],"itinerary":[],status:"",next_airport_id:2,takeoff_time:0,position:{},"last_airport_object":{},"next_airport_object":a[1],"arrives_at":0,"capacity_people":2,"capacity_cargo":0};
		ps.push(q);
		var r = {"id":3,"model":"Cessna","speed":3,"jobs_onboard":[],"itinerary":[],status:"",next_airport_id:2,takeoff_time:0,position:{},"last_airport_object":{},"next_airport_object":a[1],"arrives_at":0,"capacity_people":1,"capacity_cargo":1};
		ps.push(r);
		var s = {"id":4,"model":"Cessna","speed":3,"jobs_onboard":[],"itinerary":[],status:"",next_airport_id:2,takeoff_time:0,position:{},"last_airport_object":{},"next_airport_object":a[1],"arrives_at":0,"capacity_people":2,"capacity_cargo":2};
		ps.push(s);
		var m = game_state.metadata;
		m.world_start_time = Date.now();
		m.simulation_start_time = Date.now();
		m.last_logic_run = 0; //set to trigger first up.
		m.jobs_created = 0;
		game_state.jobs = [];
		game_state.money = 10000;
		game_state.bucks = 10;
		game_state.plane_base_speed =1 ;//1;
		game_state.flying_base_cost = 0.05;
		game_state.job_generate_wait_time = 3 * 1000 * 60; //2 mins
		game_state.next_job_generate = now.getTime();
		return game_state;
	};
	engine.force_ui_update = function(){
		engine.state_object.planes.forEach(function(plane){
			if(typeof(engine.callbacks.plane_status_changed) == "function"){
				engine.callbacks.plane_status_changed(plane);
			}
		});
	};
	engine.send_aircraft = function(plane_id, airport_id){
		var plane = lookup.lookup_plane_by_id(plane_id);
		var airport = lookup.lookup_airport_by_id(airport_id);
		var flight_distance = lookup.get_distance(plane.next_airport_object.position, airport.position);
		engine.state_object.money -= lookup.get_flight_cost(flight_distance, plane);
		plane.last_airport_object = plane.next_airport_object;
		plane.next_airport_id = airport_id;
		plane.next_airport_object = airport;
		plane.takeoff_time = engine.gameTime;
		engine.debug("Deducting " + lookup.get_flight_cost(flight_distance, plane) + " for cost of flight to " + airport.name);
		plane.arrives_at = engine.gameTime + (1000 * 60 * lookup.get_flight_time(flight_distance, plane));
		if(typeof(engine.callbacks.plane_status_changed) == "function"){
			engine.callbacks.plane_status_changed(plane);
		}
	};
	engine.assign_job_to_plane = function(plane_id,job_id){
		var job = lookup.lookup_job_by_id(job_id);
		var plane = lookup.lookup_plane_by_id(plane_id);
		plane.jobs_onboard.push(job);
		engine.hide_job(job_id);
		if(typeof(engine.callbacks.plane_status_changed) == "function"){
			engine.callbacks.plane_status_changed(plane);
		}

		engine.force_ui_update();
	};
	engine.get_jobs = function(airport_id){
		var jobs = engine.state_object.jobs;
		var jobs_out = [];
		jobs.forEach(function(job){
			if(job.start_airport == airport_id && job.taken === false){
				jobs_out.push(job);
			}
		});
		return jobs_out;
	};
	engine.hide_job = function(job_id){
		var job = lookup.lookup_job_by_id(job_id);
		job.taken = true;
	};
	return true;
}