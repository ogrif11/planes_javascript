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
	lookup.get_flight_time = function(flight_distance, plane){
		return flight_distance / plane.speed / engine.state_object.plane_base_speed;
	};
	lookup.get_flight_cost = function(flight_distance, plane){
		return flight_distance / plane.speed / engine.state_object.flying_base_cost;
	};
	lookup.get_distance = function(point1,point2){
		var R = 6371; // km
		var d = Math.acos(Math.sin(point1.latitude)*Math.sin(point2.latitude) +
						Math.cos(point1.latitude)*Math.cos(point2.latitude) *
						Math.cos(point2.longitude-point1.longitude)) * R;
		return d;
	};