function force_breakpoint(){
	debugger;
}
function convert_severity(severity_int){
	switch(severity_int){
		case(0):
			return "low";
		case(1):
			return "Important";
		case(2):
			return "CRITICAL";
		default:
			return "CRITICAL";
	}
}
function isArray(obj) {
return obj.constructor == Array;
}
function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}