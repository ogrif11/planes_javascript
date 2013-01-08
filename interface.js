if(typeof(engine) == "undefined"){
	alert('game engine not loaded..');
}
$(function(){
	var planeMarkers = [];
        var mapOptions = {
          center: new google.maps.LatLng(-34.397, 150.644),
          zoom: 8,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById("map_canvas"),
            mapOptions);



	engine.callbacks.logging_callback = function(data){
		$(".log").append(data + "<br />");
	};
	engine.callbacks.plane_status_changed = function(p){
		update_plane_status(p);
	};
	function update_plane_status(p){
		//if the DIV for this plane doesn't exist, add it.
			var div_exists = $("#plane_window_" + p.id).length !== 0;
			if(!div_exists){
				var h = "<div id='plane_window_"+p.id+"' class='plane_summary'>Plane window ID " + p.id + "<br />";
				h +="<div class='data-wrapper'>Status: <span class='plane_status emphasis'></span><br />";
				h +="<span class='arrives_in'></span><br />";
				h +="<span class='destination'></span><br />";
				h +="<br />Passengers aboard:<br /><div class='passenger_manifest'></div><br />";
				h +="<br />Jobs available:<br /><div class='job_sheet'></div><br />";
				h +="<br />Destinations available:<br /><div class='destinations'></div><br />";
				h += "</div></div>";
			$(".planes_window").append(h);

			//if the div doesn't exist, there's probably no map marker either. add it.
			var planeMarker = new google.maps.Marker();
			planeMarker.setMap(map);
			planeMarkers.push({plane_id:p.id,plane_marker:planeMarker});

			//add a summary list item too.
			var li = "<li id='plane_summary_" + p.id + "'></li>";
			$(".plane_list").append(li);
			}
			var thisMarker;
			planeMarkers.forEach(function(marker){
				if(marker.plane_id == p.id){
					thisMarker = marker;
				}
			});
			var latlng = new google.maps.LatLng(p.position.latitude,p.position.longitude);
			thisMarker.plane_marker.setPosition(latlng);

			var pwin = $("#plane_window_" + p.id).children(".data-wrapper");
			var psum = $("#plane_summary_" + p.id);
			//status, arrival time, destination/location
			pwin.children(".plane_status").text(p.status);
			psum.html("");
			var sum_text = "";
			sum_text += p.id + " " + p.status;
			sum_text +=": " + p.next_airport_object.name;
			if(p.status == "enroute"){
				pwin.children(".arrives_in").text("Arrives in " + lookup.seconds_until_arrival(p.id));
				pwin.children(".destination").text("Destination " + p.next_airport_object.name);
				sum_text +=" in " + lookup.seconds_until_arrival(p.id);

			}else{
				pwin.children(".arrives_in").text("");
				pwin.children(".destination").text("At " + p.next_airport_object.name);
			}

			//passenger manifest
			var passenger_count=0;
			var cargo_count=0;
			pwin.children(".passenger_manifest").text("");
			if(p.jobs_onboard.length > 0){
				p.jobs_onboard.forEach(function(job){
					if(job.type == "people"){
						passenger_count+=1;
					}else{
						cargo_count+=1;
					}
					pwin.children(".passenger_manifest").append("--" + job.type + " " + job.name + " Destination: " + lookup.lookup_airport_by_id(job.destination).name + "<br />");
				});
			}else{
				pwin.children(".passenger_manifest").append("(No passengers aboard)");
			}
			sum_text += " " + passenger_count + "P " + cargo_count + "C";
			psum.text(sum_text);
			//jobsheet
			pwin.children(".job_sheet").text("");
			var loaded_people = 0;
			var loaded_cargo = 0;
			p.jobs_onboard.forEach(function(job){
				if(job.type == "people"){
					loaded_people +=1;
				}
				if(job.type == "cargo"){
					loaded_cargo +=1;
				}
			});
			pwin.children(".job_sheet").html("");
			pwin.children(".destinations").html("");
			if(p.status == "grounded"){
				var ap_jobs = engine.get_jobs(p.next_airport_id);
				
				ap_jobs.forEach(function(job){
					var ap = lookup.lookup_airport_by_id(job.destination);
					if(job.type == "people" && loaded_people < p.capacity_people){
						pwin.children(".job_sheet").append("<span class='selectable_job' data-job-id='" + job.id + "' data-plane-id='" + p.id + "''>" + job.name + " " + job.type + " " + ap.name + "</span><br />");
					}
					if(job.type == "cargo" && loaded_cargo < p.capacity_cargo){
						pwin.children(".job_sheet").append("<span class='selectable_job' data-job-id='" + job.id + "' data-plane-id='" + p.id + "''>" + job.name + " " + job.type + " " + ap.name + "</span><br />");
					}
				});

			//destinations
			
				
				//give the user options where to send the plane.
				var airports = engine.state_object.airports;
				airports.forEach(function(airport){
					if(airport != p.next_airport_object){
						pwin.children(".destinations").append("<span class='selectable_destination' data-plane-id='" + p.id + "' data-to-airport='" + airport.id + "' data-from-airport='" + p.next_airport_object.id + "'> "+airport.name+"</span><br />");
					}
				});
			}


			var money = engine.state_object.money;
			$(".money_available").text(money);
	}



	/*setInterval(function(){
		//display plane info.
		$(".planes").html("");
		var p = engine.state_object.planes;
		p.forEach(function(plane){
			

			var html = "<div id='plane_"+plane.id+"' class='plane_summary'>Plane " + plane.id + " <br />Status: "+plane.status+" - " + plane.next_airport_object.name;
			if(plane.status == "enroute"){
				html += " arrives in " + lookup.seconds_until_arrival(plane.id);
			}
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

				//and jobs to load on the plane.
				html += "<div id='jobs_available'>Jobs:<br />";
				var jobs = plane.jobs;
				var loaded_people = 0;
				var loaded_cargo = 0;
				plane.jobs_onboard.forEach(function(job){
					if(job.type == "people"){
						loaded_people +=1;
					}
					if(job.type == "cargo"){
						loaded_cargo +=1;
					}
				});
				var ap_jobs = engine.get_jobs(plane.next_airport_id);
				ap_jobs.forEach(function(job){
					if(job.type == "people" && loaded_people < plane.capacity_people){
						html +="<span class='selectable_job' data-job-id='" + job.id + "' data-plane-id='" + plane.id + "''>" + job.name + " " + job.type + "</span><br />";
					}
				});
				html += "</div>"; //jobs div
			}
			html+="</div>"; //plane div
			$(".planes").append(html);
		});

		//display money info.
		var money = engine.state_object.money;
		$(".money_available").text(money);

	},500);*/

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
	$(".selectable_job").live('click',function(){
		var job_id = $(this).attr('data-job-id');
		var plane_id = $(this).attr('data-plane-id');
		engine.assign_job_to_plane(plane_id, job_id);
	});


	//final setup
	engine.force_ui_update();
});