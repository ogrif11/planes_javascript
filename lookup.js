var lookup = {};
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
	lookup.lookup_plane_by_id = function(id){
		var plane = false;
		engine.state_object.planes.forEach(function(p){
			if(p.id == id){
				plane = p;
				return;
			}
		});
		return plane;
	};
	lookup.lookup_job_by_id = function(id){
		var job = false;
		engine.state_object.jobs.forEach(function(j){
			if(j.id == id){
				job = j;
				return;
			}
		});
		return job;
	};
	lookup.lookup_estimate_plane_position = function(plane){
		var progress_percent = (engine.gameTime - plane.takeoff_time) / (plane.arrives_at - plane.takeoff_time);

		var beginPosition = plane.last_airport_object.position;
		var endPosition = plane.next_airport_object.position;
		var estPosition = {"latitude":beginPosition.latitude,"longitude":beginPosition.longitude};
		estPosition.latitude += (endPosition.latitude - beginPosition.latitude) * progress_percent;
		estPosition.longitude += (endPosition.longitude - beginPosition.longitude) * progress_percent;
		return estPosition;
	};
	lookup.seconds_until_arrival = function(plane_id){
		var plane = lookup.lookup_plane_by_id(plane_id);
		var seconds_until_arrival = (plane.arrives_at - engine.gameTime)/1000;
		return Math.round(seconds_until_arrival > 0 ? seconds_until_arrival : 0);
	};
	lookup.get_flight_time = function(flight_distance, plane){
		return Math.round(((flight_distance / plane.speed)/ engine.state_object.plane_base_speed) / 1000);
	};
	lookup.get_flight_cost = function(flight_distance){
		return Math.round(flight_distance * engine.state_object.flying_base_cost);
	};
	lookup.lookup_flight_retail_cost = function(flight_distance){
		return Math.round(flight_distance * engine.state_object.flying_base_cost * 0.85);
	};
	lookup.get_distance = function(point1,point2){
		var R = 6371; // km
		var d = Math.acos(Math.sin(point1.latitude)*Math.sin(point2.latitude) +
						Math.cos(point1.latitude)*Math.cos(point2.latitude) *
						Math.cos(point2.longitude-point1.longitude)) * R;
		return Math.round(d);
	};