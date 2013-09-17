# random things I've learned about Kinetic.js

# * positive x is to the RIGHT, positive y is DOWN, 0,0 is the upper left corner
# * The "center" of the shape is initially it's upper left corner. We want to
#   define it as half the width to the right and half the height down from there
#   with the offset property. This allows rotation to happen about the true 
#   center of the shape.
# * You have to set the offset property when the shape is defined, you 
#   apparently can't do it later (I might be wrong about this).
# * You have to call layer.draw() after making changes to shapes in order to
#   see anything on the screen.

# A prototypical sprite
class GenericSprite extends fabric.Rect
    # These properties will be in the prototype of the Sprite
    # and thus appear as properties of all instances of that sprite
    # Variables prefixed with @ will be properties of individual sprite
    # instances.
    constructor: (@spriteId) ->
        # Kinetic.Rect isn't a coffeescript class, so we can't just call
        # super, unfortunately. This is almost as good.
        sWidth = this.spriteType * 5
        
        shapeParams =
            height: 100, 
            width: 100, 
            strokeWidth: sWidth, 
            fill: "rgb(0,255,0)", 
            stroke: "rgb(0,0,0)",
            cornerSize: 20
        
        fabric.Rect.call(this, shapeParams)
        
    applyRules: (environment) ->
        for rule in @_rules
            # call each rule's act method, supplying this sprite and
            # information about other sprites in its environment
            rule.act(this, environment)

    # returns the index of the new rule
    addRule: (rule) ->
        @_rules.push(rule)
        return @_rules.length - 1

    # will complain if given a bad index
    setRule: (index, rule) ->
    
        if @_rules[index] != undefined
            @_rules[index] = rule
        else
            throw Error("The rule index #{index} doesn't exist.")

    addTransform: (transform) ->
        myRule = new Rule();
        myRule.setTransform(transform);
        this.addRule(myRule);

    applyTransform: (transform) ->
        console.log("apply transform")
        this.set({
            left: this.getLeft() + transform.dx
            top: this.getTop() + transform.dy
            angle: this.getAngle() + transform.dr
            #width: this.getWidth() * transform.dxScale
            width: this.getWidth() + transform.dxScale
            #height: this.getHeight * transform.dyScale
            height: this.getHeight() + transform.dyScale
        })
    
    showLearning: ->
        console.log("showLearning")
        this.set({
            borderColor: "red",
            cornerColor: "red",
        })
        canvas.renderAll();
    
    showNormal: ->
        console.log("showNoraml")
        this.set({
            borderColor: "rgb(210,210,255)",
            cornerColor: "rgb(210,210,255)",
        })
        canvas.renderAll();

# makes classes for different types of sprites
SpriteFactory = (spriteType, imageObj) ->
    console.log "sprite factory" + spriteType + imageObj
    # a particular kind of sprite, with its own name and image file
    class Sprite extends GenericSprite
    
        console.log "class sprite"
        # String, a name for this type of sprite
        spriteType: spriteType

        # String, the hash id of the jpg
        # mhewj - changed this to the image object
        imageObj: imageObj

        # The underscore here indicates private; you aren't supposed to modify
        # the list directly. Use mySpriteInstance.addRule() instead.
        # Because the list is in the Sprite prototype, rules will apply to all
        # instances of that Sprite.
        _rules: []

    return Sprite

# simple transform applied all the time, ignores environment
class Rule
    setTransform: (transform) ->
    
        # fill in any missing values with intelligent defaults
        defaultTransform =
            dx: 0
            dy: 0
            dr: 0
            dxScale: 1
            dyScale: 1

    constructor: (transform) ->
        # fill in any missing values with intelligent defaults
        for p, v of @defaultTransform
            if p not of transform
                transform[p] = v
        @transform = transform

    act: (sprite, environment) ->
    
        # this isn't an interaction, so just apply the rule without checking
        # anything
        sprite.applyTransform(@transform)
        
# a transform which is conditional on the environment of the sprite
class Interaction extends Rule
    # I imagine an environment as a object with properties corresponding to
    # spriteTypes, where the value of each is an integer indicating how many
    # sprites of that type are in the environment, e.g.
    # {star: 1, cloud: 2}
    setEnvironment: (@requiredEnvironment) ->

    act: (sprite, environment) ->
        # unlike StageCast, we want sloppy application here; extra things
        # in the environment don't matter as long as the minimum required are
        # present
        
        shouldAct = true
        for spriteType, minCount of @requiredEnvironment
            if spriteType not of environment
                shouldAct = false
            else if environment[spriteType] < minCount
                shouldAct = false

        if shouldAct
            sprite.applyTransform(@transform)

window.spriteList = []
window.spriteTypeList = []

window.tick = ->
    for sprite in spriteList
        sprite.applyRules()
    canvas.renderAll()


window.loadSpriteTypes = ->
    console.log "loading sprite types"
    spriteTypeList = [] # re-init. hmm, this could get messy TODO
    $("img").each (i, sprite) -> # for each sprite in the drawer
        console.log "loading sprite type" + i
        window.spriteTypeList.push( SpriteFactory( i , sprite ) ) #make a factory
        
        $(sprite).draggable # this sprite is draggable
            revert: false, # dont bounce back after drop
            helper: "clone", # make a copy when pulled off the dragsource
            stop: (ev) -> # when dropped
                #self = this;
                console.log(i); # tell me which one you are
                newSprite = new window.spriteTypeList[i]  # make one
                spriteList.push( newSprite )
                newSprite.setTop(ev.clientY)
                newSprite.setLeft(ev.clientX)
                canvas.add(newSprite)
                canvas.renderAll();
