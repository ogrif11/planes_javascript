if(typeof(engine) == "undefined"){
	alert('game engine not loaded..');
}
$(function(){
	var planeMarkers = [];
	var airportMarkers = [];
        var mapOptions = {
          center: new google.maps.LatLng(-34.397, 150.644),
          zoom: 8,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById("map_canvas"),
            mapOptions);

	google.maps.event.addListener(map, 'center_changed', function() {
		engine.force_ui_update();
	});

	google.maps.event.addListener(map, 'zoom_changed', function() {
		engine.force_ui_update();
	});
	engine.callbacks.logging_callback = function(data){
		$(".log").append(data + "<br />");
	};
	engine.callbacks.plane_status_changed = function(p){
		update_plane_status(p);
	};
	engine.callbacks.airport_status_changed = function(a){
		update_airport_status(a);
	};
	engine.callbacks.cash_changed_hands = function(amount,reason){
		$(".cash_changed_hands").show();
		$(".cash_changed_hands").text("$"+amount);
		$(".cash_changed_hands").fadeOut(1500);
	};
	engine.callbacks.no_money = function(amount,reason){
		alert('you ran out of money - wait for money or start again. Amount needed to continue: ' + amount);
	};
	function get_image(type,use_image_tag){
        var person_src = "personIcon.gif";
        var cargo_src= "box_48.png";
        var output_image = "";
		if(type == "people"){
			output_image = person_src;
		}else{
            output_image = cargo_src;
		}
        if(typeof(use_image_tag) != "undefined" && use_image_tag == true){
            return "<img src='" + output_image + "' style='height: 16px; width: 16px;'>";
        }else{
            return  output_image.substr(0,person_src.indexOf("."));
        }
	}
	function update_airport_status(a){
		//find marker and remove.
		for(var i=airportMarkers.length-1;i>=0;i--){
			if(airportMarkers[i].id === a.id){
				airportMarkers[i].airport_marker.setMap(null);
				airportMarkers.splice(i,1);
			}
		}

		if(a.activated ===true){
			//remake marker.
			var latlng = new google.maps.LatLng(a.position.latitude,a.position.longitude);
			
			var airportMarker = new MarkerWithLabel({
					map: map,
					labelText: "<img src='http://google-maps-icons.googlecode.com/files/airport.png' class='airport_marker_image' id='airport_marker_" + a.id + "' />" + a.id,
					labelClass: 'airportLabel',
					labelVisible: true,
					icon: "http://maps.google.com/mapfiles/ms/icons/z.png"
				});
			airportMarker.setPosition(latlng);
			airportMarkers.push({id:a.id,airport_marker:airportMarker});
		}

	}
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
				/*var planeMarker = new google.maps.Marker();
				planeMarker.setMap(map);*/
				var planeMarker = new MarkerWithLabel({
					map: map,
					labelText: "<img class='plane_marker_image' data-plane-id='" + p.id + "' src='http://maps.google.com/mapfiles/ms/icons/plane.png' id='plane_marker_" + p.id + "' />" + p.id,
					labelClass: 'markerLabel',
					labelVisible: true,
					icon: "http://maps.google.com/mapfiles/ms/icons/z.png"
				});
				planeMarkers.push({plane_id:p.id,plane_marker:planeMarker});

				//add a summary list item too.
				var li = "<li id='plane_summary_" + p.id + "' class='plane_summary_item clickable' data-plane-id='" + p.id + "'><span class='summary_id'></span> <span class='summary_status'></span> <span class='summary_airport'></span> <span class='summary_arrival_delta'></span> " + get_image("people",true) + "<span class='summary_people'></span> " + get_image("cargo",true) + "<span class='summary_cargo'></span></li>";
				$(".plane_list").append(li);

				//hide all cards again.
				$(".plane_summary").hide();
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
            psum.children(".summary_id").text(p.id);
            psum.children(".summary_status").text(p.status);
            psum.children(".summary_airport").text(p.airport);
		
			if(p.status == "enroute"){
				pwin.children(".arrives_in").text("Arrives in " + lookup.seconds_until_arrival(p.id));
				pwin.children(".destination").text("Destination " + p.next_airport_object.name);
            psum.children(".summary_arrival_delta").text("arrives in " + lookup.seconds_until_arrival(p.id));
				var rise = p.next_airport_object.position.latitude - p.last_airport_object.position.latitude;
							var run =p.next_airport_object.position.longitude- p.last_airport_object.position.longitude;
							var rotation_angle = lookup.get_angle_to_rotate(rise,run);
							$("#plane_marker_" + p.id).rotate(rotation_angle);
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
					pwin.children(".passenger_manifest").append("<span class='passenger_on_plane clickable " + get_image(job.type,false) + "' data-plane-id='" + p.id + "' data-job-id='" + job.id + "'>" + " " + job.name + " Destination: " + lookup.lookup_airport_by_id(job.destination).name + "</span><br />");
				});
			}else{
				pwin.children(".passenger_manifest").append("(No passengers aboard)");
			}
			psum.children(".summary_people").text(passenger_count);
            psum.children(".summary_cargo").text(cargo_count);
            //psum.html(sum_text);
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
					if(job.type == "people" && loaded_people < p.capacity_people && ap.activated){
						pwin.children(".job_sheet").append("<span class='selectable_job clickable' data-job-id='" + job.id + "' data-plane-id='" + p.id + "''>" + get_image(job.type,true) + " " +job.name + " " +  ap.name + "</span><br />");
					}
					if(job.type == "cargo" && loaded_cargo < p.capacity_cargo && ap.activated){
						pwin.children(".job_sheet").append("<span class='selectable_job clickable' data-job-id='" + job.id + "' data-plane-id='" + p.id + "''>" + get_image(job.type,true) + " " + job.name + " " + ap.name + "</span><br />");
					}
				});

			//destinations
			
				
				//give the user options where to send the plane.
				var airports = engine.state_object.airports;
				airports.forEach(function(airport){
					if(airport != p.next_airport_object && airport.activated){
						pwin.children(".destinations").append("<span class='selectable_destination clickable' data-plane-id='" + p.id + "' data-to-airport='" + airport.id + "' data-from-airport='" + p.next_airport_object.id + "'> "+airport.name+"</span><br />");
					}
				});
			}


			var money = engine.state_object.money;
			$(".money_available").text(money);
	}

	//events.
		$(document).on('click','.selectable_destination',function(){
	//$(".selectable_destination").on('click',function(){
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
		if(engine.send_aircraft(plane_id,to_airport_id)){
					show_map();
		}
	});
		$(document).on('click','.selectable_job',function(){
		var job_id = $(this).attr('data-job-id');
		var plane_id = $(this).attr('data-plane-id');
		engine.assign_job_to_plane(plane_id, job_id);
	});
	$(document).on('click','.passenger_on_plane',function(){
		//drop job off at airport if the plane is grounded.
		var job_id = $(this).attr('data-job-id');
			var plane_id = $(this).attr('data-plane-id');
		engine.drop_job_at_this_airport(job_id,plane_id);
	});
	
	$(document).on('click','.plane_summary_item',function(){
		//show relevant plane detail card.
			var id = $(this).attr('data-plane-id');
			$(".plane_summary").hide();
			hide_map();
			hide_instructions();
		$("#plane_window_"+id).show();
	});
	$(document).on('click','.show_map',function(){
	//$(".show_map").on('click',function(){
		show_map();
		hide_instructions();
	});
	$(document).on('click','.start_game',function(){
	//$(".start_game").on('click',function(){
		hide_instructions();
		show_map();
	});
	$(document).on('click','.plane_marker_image',function(){
	//$(".plane_marker_image").on('click',function(){
		//show relevant plane detail card.
			var id = $(this).attr('data-plane-id');
			$(".plane_summary").hide();
			hide_instructions();
			hide_map();
		$("#plane_window_"+id).show();
	});
	show_map = function(){
		//$(".map_wrapper").show();
		$(".plane_summary").hide();
		$(".map_wrapper").css({'height':'400px'});
	};
	hide_map = function(){
		$(".map_wrapper").css({'height':'0px'});
	};
	hide_instructions = function(){
		$(".instructions").hide();
		
	};
	//final setup
	engine.force_ui_update();
	//

//set up map bounds to airports.
			var lowest_lat = 0;
			var highest_lat = 0;
			var lowest_long = 0;
			var highest_long = 0;
			engine.state_object.airports.forEach(function(airport){
				if(airport.position.latitude < lowest_lat || lowest_lat === 0){
					lowest_lat = airport.position.latitude;
				}
				if(airport.position.longitude < lowest_long || lowest_long === 0){
					lowest_long = airport.position.longitude;
				}
				if(airport.position.latitude > highest_lat || highest_lat === 0){
					highest_lat = airport.position.latitude;
				}
				if(airport.position.longitude >    highest_long || highest_long === 0){
					highest_long = airport.position.longitude;
				}
			});
			var latlngbounds = new google.maps.LatLngBounds(new google.maps.LatLng(lowest_lat, lowest_long),new google.maps.LatLng(highest_lat, highest_long));
			map.fitBounds(latlngbounds);
			hide_map();
});