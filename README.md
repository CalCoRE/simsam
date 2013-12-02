simsam
======

Glossary
--------

### Project
An as-of-yet poorly conceptualized organizing container of **simulations** and **animations**. Has an owner and a name.

### Animation
As in stop-motion animation (a la Wallace  & Grommet), or  Stop Action Movies (SAM). An ordered list of **frames**. Users capture frames with their web cams of scenes they physically construct with anything they like. The app plays the animation by just displaying all the frames one after another. Also has an associated list of **sprites** which have been cropped from the animation.

### Frame 
A jpeg, captured as part of an **animation**. Since they are sorted separately and referenced by animations, a user could load someone else's animation and start re-ordering it or adding to it.

### Sprite 
A jpeg cropped from a **frame**. These serve as symbols for use in **simulations**. In theory importable and exportable, so a user can collect sprites from their own animations, from other users' animations, or other users' sprite collections, whatever they want.

### Sprite Object 
A class of thing you can add to a simulation canvas. Draws its image data from a **sprite**. Has rules and interactions. Also could theoretically be shared/imported/exported between users (so, unlike sharing sprites, they would be sharing behaviors as well as images/symbols).

### Sprite Instance 
An individual thing on a simulation canvas, whose behavior is governed by its **sprite object**.

### Simulation 
A programmable environment. A set of **sprite objects** and a **state**.

### State
The positions and orientations of arbitrary **sprite instances** on an html canvas, most likely the textual output of a Fabric.js serialization function, with some added stuff, like the ids of **sprite objects** each **sprite instance** belongs to.

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


