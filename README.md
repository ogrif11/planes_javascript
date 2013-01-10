Planes In Javascript
=================

Planes In Javascript

View at <a href='http://htmlpreview.github.com/?https://github.com/rrrhys/planes_javascript/blob/master/host.html'>live demo of Planes in Javascript</a>

Planes in Javascript is a clone of the game 'Pocket Planes' for iOS. 

The objective of that game is to grow an air freight company by increasing your fleet of planes and buying up airports. 

The user makes money by loading planes with passengers and cargo and sending them off to their destination.

The game uses real world airports and city populations.

I'm rewriting an inspired clone in javascript to brush up on my JS and google maps API. <a href='http://htmlpreview.github.com/?https://github.com/rrrhys/planes_javascript/blob/master/host.html'>Have a try</a>. Load passengers on planes and send them to airports to earn money. You can't buy more airports and planes yet (but the JS is easy to hack..)

*engine.js* - the underlying engine for the game. Keeps track of game time, money earnt, planes and airports available, planes location in the sky and cargo jobs waiting.

*interface.js* - uses events raised by engine.js to update the UI of the game (uses a lot of jQuery)

*lookup.js* - holds functions for trig, estimating plane position based on lat/long/time taken, cost and time of flight, distance based on lat/long.

*helpers.js* - ... Helper functions.