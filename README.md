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


Interaction
-----------
Interactions are rules that get fired when two objects interact (intersect)
with one another.  In order to create an interaction rule from the UI, select
an object (double-click) and move it to interact with the object in question.
Following is the description of what happens in code to trigger the setup
of an interaction rule.

Each time an object is moved on the canvas, "simObjectModified" is called.
This function checks to see if an object is currently recording, and if so, 
if it has interacted with another object (intersection test).  If so, then
we call the "interactionEvent" method on the moving object (the one that has 
been selected).

Sprite::interactionEvent sets up the appropriate callback which will be used
when a type of interaction is selected from the UI floating menu (Translate,
Clone, Delete, etc.).  This callback is effectively "this.interactionCallback", 
or Sprite::interactionCallback(choice), which allows the current object to
continue setting up the appropriate behavior based on the UI selection.

The UI devices call "uiInteractionChoose", which will call "uiInteractionCB".
At this point the selected object has set uiInteractionCB to its own method
"interactionEvent".  Here the interaction rule is added to the object.  If
the interaction rule is translate, then translate recording begins, and will
finish on the next double-click.
