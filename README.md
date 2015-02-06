SiMSAM
======
SiMSAM stands for <b>Si</b>mulation, <b>M</b>easurement, and <b>S</b>top <b>A</b>ction <b>M</b>oviemaking. It combines the playful, expressive, easy-to-use features of [SAM Animation](http://icreatetoeducate.com/) with the precision and testability of programming environments like [NetLogo](http://ccl.northwestern.edu/netlogo) and [StageCast Creator](http://www.stagecast.com/). 

To learn more, visit the [SiMSAM Project Site](http://sites.tufts.edu/simsam).
To learn more about us, visit the [Expressive Technologies Lab](http://extech.tufts.edu).

SiMSAM is made possible through the generous support of the National Science Foundation, Grant #[IIS-1217100](http://www.nsf.gov/awardsearch/showAward?AWD_ID=1217100), and the Tufts University Mason Fund. Any opinions, findings, and conclusions or recommendations expressed in this material are those of the authors and do not necessarily reflect the views of the NSF or Tufts University. 

Development by [Geisel Software](http://www.geisel-software.com/), Christopher Macrander, [Michelle Wilkerson-Jerde](http://sites.tufts.edu/michelle), Amanda Bell. 
Major contributions by [Brian Gravel](http://ase.tufts.edu/education/faculty/gravel.asp), Margot Krouwer, Yara Shaban, Mirjana Hotomski, and members of the [Center for Engineering Education and Outreach](http://ceeo.tufts.edu/).

Pre-Installation Preparation
----------------------------
SiMSAM runs on the [Django Web Framework](https://www.djangoproject.com/). You'll first need to install that.
These instructions are specific to Mac OS X. We'll put some PC instructions here soon!

First, you'll need to install [pip](https://bootstrap.pypa.io/get-pip.py). After downloading, use Terminal to navigate to the directory where get-pip.py is located and run it. For example, when I download get-pip.py it is saved to my Downloads directory. I can navigate to find it this way:

    ShelboBaggins:~ michellewilkersonjerde$ ls
  
I typed "ls" to see the contents of the directory I am currently in. This produces a list:

    Applications  Movies
    Box Files Backup Music
    Box Sync			Pictures
    Desktop				Public
    Documents			Sites
    Downloads	    Dropbox
    Google Drive
    Library

Since get-pip.py was saved to the Downloads folder, I want to naviagate there. I do that using the "cd" or change directory command:

    ShelboBaggins:~ michellewilkersonjerde$ cd Downloads
    ShelboBaggins:Downloads michellewilkersonjerde$ 

Now, I can install get-pip:

    ShelboBaggins:Downloads michellewilkersonjerde$ python get-pip.py

If you have any permissions errors, try doing the same thing using sudo:

    ShelboBaggins:Downloads michellewilkersonjerde$ sudo python get-pip.py

You will need to enter your user password.

Once pip is installed, you can use it in Terminal to get the appropriate version of Django. This application is written to work with Django 1.6.5, so let's install that one:

    ShelboBaggins:Downloads michellewilkersonjerde$ pip install Django==1.6.5

Installation
------------
Download a version of SiMSAM to your computer, and put it somewhere you'll remember. If it's a different branch from the master branch, you may want to re-title the directory to "simsam".

Open Terminal. If you can't find Terminal, just use Spotlight (the magnifying glass in the upper right corner of any Mac).

Navigate to the simsam folder in Terminal. Depending on where the folder is, this may look different. If simsam lives on the Desktop, the way to get there is:

        ShelboBaggins:~ michellewilkersonjerde$ cd Desktop/simsam

The "cd" means "change directory", and Desktop/simsam is the path (in this case, in the "Desktop" folder, then in the "simsam" folder). So if simsam lives somewhere else, you just need to find out the right path. In Terminal you can type "cd" and then press tab twice to see what folders are available. If you need to move "out" from a folder to its container, then type "cd ..".

Once you are in the simsam directory, type "ls" in Terminal and press enter to make sure you are in the right place. The folder should contain a file called "manage.py". Then type:

        python manage.py syncdb

This will create a database where user info is stored and simsam information saved as you make animations and simulations. The final move is to start it up:

        nohup python manage.py runserver

This starts simsam - it should tell you something like "appending output to nohup". Once that happens, you can point a browser (Firefox or Chrome) to 127.0.0.1:8000 and you are ready to go.

Creating new user accounts in SiMSAM
------------------------------------

All installations of SiMSAM I've installed recently have a superuser named simsam, with password s1ms4m. You can log into simsam using this account, or use it to create other user accounts. There should be one account per student group we are working with.

To create a new account, make sure SiMSAM is running and then point your browser to 127.0.0.1:8000/admin . This will take you to an administrative interface. Log in with the simsam superuser. Then, you can use that interface to create new users. Once they're created, go back to 127.0.0.1:8000 and you can log in using the new usernames and passwords.

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
