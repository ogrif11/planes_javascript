var engine;
var lookup;
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
	lookup = {};
	engine.debug_enabled = false;
	engine.initialised = true;
	if(debug){
		engine.debug_enabled = true;
		console.log("Debugger enabled.");
	}
	lookup.lookup_airport_by_id = function(id){
		var ap=false;
		engine.state_object.airports.forEach(function(a){
			if(a.id == id){
				ap=a;
				return;
			}
		});
		return ap;
	};
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
		var gameTime = now.getTime();
		if(state.metadata.last_logic_run < gameTime - logic_run_wait_time){
			//TODO: Is it ok for simulation to continue if game is paused?

			var currentDate = now.getSeconds();
			engine.debug("tick: Has been " + (logic_run_wait_time/10) + "/100s since last run.. " + currentDate);
			
				{
				//TODO: Refactor away.

					//check for arrivals
					var p = engine.state_object.planes;

					p.forEach(function(plane){
								var ap = lookup.lookup_airport_by_id(plane.next_airport);
						if(plane.arrives_at < gameTime){
							if(plane.arrives_at > 0){
								engine.debug("Plane " + plane.id + " is landing at " + ap.name + " (arrival time " + plane.arrives_at + ")");
							}else{
								engine.debug("Plane " + plane.id + " is grounded at " + ap.name);
							}
						}else{
								engine.debug("Plane " + plane.id + " is enroute to " + ap.name + " (arrival time " + plane.arrives_at + ")");
						}
						if(plane.jobs_onboard.length > 0){
							plane.jobs_onboard.forEach(function(job){
								engine.debug("-- With " + job.type + " " + job.name + " onboard.");
							});
						}
					});
				}
			state.metadata.last_logic_run = now.getTime();
		}
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
		a.push({"id":1,"name":"Sydney","activated":false,"jobs":[],"x":1,"y":4});
		a.push({"id":2,"name":"Brisbane","activated":false,"jobs":[],"x":2,"y":8});
		var ps = game_state.planes;
		var p = {"id":1,"model":"Cessna","jobs_onboard":[],"itinerary":[],"next_airport":1,"arrives_at":0,"capacity_people":2,"capacity_cargo":0};
		p.jobs_onboard.push({"type":"people",name:"Fred",gender:"Male"});
		p.jobs_onboard.push({"type":"people",name:"Wilma",gender:"Female"});
		ps.push(p);
		var m = game_state.metadata;
		m.world_start_time = Date.now();
		m.simulation_start_time = Date.now();
		m.last_logic_run = 0; //set to trigger first up.
		game_state.money = 10000;
		game_state.bucks = 10;
		return game_state;
	};
	return true;
}