if(typeof(engine) == "undefined"){
	alert('game engine not loaded..');
}
$(function(){
	engine.logging_callback = function(data){
		$(".last_log").html(data + "<br />");
		$(".log").append(data + "<br />");
	};
	setInterval(function(){

		//display plane info.
		$(".planes").html("");
		var p = engine.state_object.planes;
		p.forEach(function(plane){

			var html = "<div id='plane_"+plane.id+"' class='plane_summary'>Plane " + plane.id + " <br />Status: "+plane.status+" - " + plane.next_airport_object.name;
			html +="<div id='passenger_list_" + plane.id + "'>Passenger Manifest<br />";


						if(plane.jobs_onboard.length > 0){
							plane.jobs_onboard.forEach(function(job){
								html += "&nbsp;&nbsp;"+job.type + " " + job.name + " Destination: " + lookup.lookup_airport_by_id(job.destination).name + "<br />";
							});
						}

			html+="</div>"; //passenger list
			if(plane.status == "grounded"){
				//give the user options where to send the plane.
				html +="<div id='destinations_available'>Destinations:<br />";
				var airports = engine.state_object.airports;
				airports.forEach(function(airport){
					if(airport != plane.next_airport_object){
						html +="<span class='selectable_destination' data-plane-id='" + plane.id + "' data-to-airport='" + airport.id + "' data-from-airport='" + plane.next_airport_object.id + "'> "+airport.name+"</span><br />";
					}
				});
				html +="</div>"; //destinations
			}
			html+="</div>"; //plane div
			$(".planes").append(html);
		});

		//display money info.
		var money = engine.state_object.money;
		$(".money_available").text(money);

	},500);

	//events.
	$(".selectable_destination").live('click',function(){
		var from_airport_id = $(this).attr('data-from-airport');
		var to_airport_id = $(this).attr('data-to-airport');
		var plane_id = parseInt($(this).attr('data-plane-id'),10);
		var plane = lookup.lookup_plane_by_id(plane_id);
		var from_airport = lookup.lookup_airport_by_id(from_airport_id);
		var to_airport = lookup.lookup_airport_by_id(to_airport_id);
		var flight_distance = lookup.get_distance(from_airport.position,to_airport.position);
		var flight_time = lookup.get_flight_time(flight_distance, plane);
		var flight_cost = lookup.get_flight_cost(flight_distance, plane);
		engine.debug(from_airport.name + " to " + to_airport.name + " is " + flight_distance + " will take " + flight_time + " and will cost " + flight_cost);
		engine.send_aircraft(plane_id,to_airport_id);
	});
});