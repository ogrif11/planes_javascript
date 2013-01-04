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