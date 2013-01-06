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
	engine.callbacks.plane_landed_callback = false;
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
		var logic_run_wait_time = 2000; //ms
		var state = engine.state_object;
			var now = new Date();
		engine.gameTime = now.getTime();
		if(state.metadata.last_logic_run < engine.gameTime - logic_run_wait_time){
			//TODO: Is it ok for simulation to continue if game is paused?

			var currentDate = now.getSeconds();
			engine.debug("tick: Has been " + (logic_run_wait_time/10) + "/100s since last run.. " + currentDate);
			
				{
				//TODO: Refactor away.

					//check for arrivals
					var p = engine.state_object.planes;

					p.forEach(function(plane){
								var ap = lookup.lookup_airport_by_id(plane.next_airport_id);
								plane.next_airport_object = ap;
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
							}else{
								engine.debug("Plane " + plane.id + " is grounded at " + ap.name);
								plane.status = "grounded";
							}
						}else{
								engine.debug("Plane " + plane.id + " is enroute to " + ap.name + " (arrival time " + plane.arrives_at + ")");
						
								plane.status = "enroute";
						}
						if(plane.jobs_onboard.length > 0){
							plane.jobs_onboard.forEach(function(job){
								engine.debug("-- With " + job.type + " " + job.name + " onboard.");
							});
						}
					}); //each plane

					//is it time to generate jobs?
					if(engine.state_object.next_job_generate < engine.gameTime){
						//time to generate new jobs.

							//for each airport from
							var from_airports = engine.state_object.airports;
							from_airports.forEach(function(from_airport){
								//make a list of airports to.
								var to_airports = engine.state_object.airports;
								to_airports.forEach(function(to_airport){
									if(to_airport.id !== from_airport.id){
										//& generate that many  jobs.
										from_airport.jobs = from_airport.jobs.concat(engine.generate_jobs(from_airport,to_airport));}
								});
							});
						engine.state_object.next_job_generate = engine.gameTime + engine.state_object.job_generate_wait_time;
						if(typeof(engine.callbacks.new_jobs_callback) == "function"){engine.callbacks.new_jobs_callback();}
					}
				}
			state.metadata.last_logic_run = now.getTime();
		}
	};
	engine.generate_jobs = function(from_airport,to_airport){
		var people_jobs_to_generate = from_airport.sizeMillions * to_airport.sizeMillions * 0.1 * getRandomInt(0,3);
		var cargo_jobs_to_generate = from_airport.sizeMillions * to_airport.sizeMillions * 0.1 * getRandomInt(0,3);
		var people_first_names = ['Amy','Joanna','Kirstee','Michelle','Simon','Ben','Melanie','George','Ann','Hanna','Craig','Chris','Elizabeth','Suzanne','Georgina','Patricia','Victoria','Zana','Hilary','Dorothy','Judy','Kim','Esther','Gitta','Giha','Lyn','Glenda','Ann','Janette','Joyce','Leah'];
		var people_last_names = ['Brown','Smith','Jones','Williams','Jackson','White','Black','Gray'];
		var cargo_names = ['Cups','Bottles','Boxes','Phones','Mice','Keyboards','Monitors','USB Sticks','Wallets','Staplers','Labels','Paper','iPhones','Signs'];
		var jobs = [];
		var i;
		for(i = 0; i < people_jobs_to_generate;i++){
			var fn = people_first_names[Math.floor(Math.random()*people_first_names.length)];
			var ln = people_last_names[Math.floor(Math.random()*people_last_names.length)];
			jobs.push({"type":"people",name:fn + " " + ln,gender:"NA",cash_payment:lookup.get_flight_retail_cost,destination:to_airport.id});
		}
		for(i = 0; i < cargo_jobs_to_generate;i++){
			var cargoname = cargo_names[Math.floor(Math.random()*cargo_names.length)];
			jobs.push({"type":"cargo",name:cargoname,gender:"NA",cash_payment:lookup.get_flight_retail_cost,destination:to_airport.id});
		}
		return jobs;
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
		a.push({"id":1,"name":"Sydney","sizeMillions":5,"activated":false,"jobs":[],position:{latitude:-32.010396,longitude:135.119128}});
		a.push({"id":2,"name":"Brisbane","sizeMillions":2,"activated":false,"jobs":[],position:{latitude:-33.922423,longitude:151.183376}});
		var ps = game_state.planes;
		var p = {"id":1,"model":"Cessna","speed":3,"jobs_onboard":[],"itinerary":[],status:"",next_airport_id:1,"next_airport_object":{},"arrives_at":0,"capacity_people":2,"capacity_cargo":0};
		p.jobs_onboard.push({"type":"people",name:"Fred",gender:"Male",cash_payment:100,destination:1});
		p.jobs_onboard.push({"type":"people",name:"Wilma",gender:"Female",cash_payment:100,destination:2});
		ps.push(p);
		var now = new Date();
		var q = {"id":2,"model":"Cessna","speed":3,"jobs_onboard":[],"itinerary":[],status:"",next_airport_id:1,"next_airport_object":{},"arrives_at":now.getTime() + 3000,"capacity_people":2,"capacity_cargo":0};
		q.jobs_onboard.push({"type":"people",name:"Homer",gender:"Male",cash_payment:100,destination:1});
		q.jobs_onboard.push({"type":"people",name:"Marge",gender:"Female",cash_payment:100,destination:2});
		ps.push(q);
		var m = game_state.metadata;
		m.world_start_time = Date.now();
		m.simulation_start_time = Date.now();
		m.last_logic_run = 0; //set to trigger first up.
		game_state.money = 10000;
		game_state.bucks = 10;
		game_state.plane_base_speed = 250;
		game_state.flying_base_cost = 20;
		game_state.job_generate_wait_time = 2 * 1000 * 60; //2 mins
		game_state.next_job_generate = now.getTime();
		return game_state;
	};
	engine.send_aircraft = function(plane_id, airport_id){
		var plane = lookup.lookup_plane_by_id(plane_id);
		var airport = lookup.lookup_airport_by_id(airport_id);
		var flight_distance = lookup.get_distance(plane.next_airport_object.position, airport.position);
		engine.state_object.money -= lookup.get_flight_cost(flight_distance, plane);
		plane.next_airport_id = airport_id;
		plane.next_airport_object = airport;
		plane.arrives_at = engine.gameTime + (1000 * 60 * lookup.get_flight_time(flight_distance, plane));
	};
	return true;
}