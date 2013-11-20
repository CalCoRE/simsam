simsam
======

Files
-----

Here are some of the interesting files you should know about.

* simsam_app/coffee - CoffeeScript files here
* simsam_app/js		- JavaScript and transpiled CoffeeScript

### js/simlite.js
Contains the initialization function to initialize Sim.  It also contains
global functions that are used from elsewhere in Sim.  For example, waiting
on events (double click, Fabric.js movement, etc.).  This is also used for
all generic JavaScript functions in Sim, such as interacting with the user.


### coffee/sprite.coffee
This handles Sprites, their Rules and Actions.  A Sprite is the object which
may be acted upon.  Sprites are a part of a class of Sprites as determined
by the UI.  Creating a Rule for one Sprite, in fact, creates a Rule for all
Sprites of that type.

Rules determine *when* an object shall be acted upon.  The most simple Rule
causes the object to be acted upon for each step.  InteractionRule, for example,
will cause the object to be acted upon only when it interacts with another
object.

Actions determine *what* an object will do when acted upon.  Examples are
delete, transform (move), clone, etc.


