# A prototypical sprite
class GenericSprite extends fabric.Image
    # These properties will be in the prototype of the Sprite
    # and thus appear as properties of all instances of that sprite
    # Variables prefixed with @ will be properties of individual sprite
    # instances.
    constructor: (@spriteId) ->
        sWidth = this.spriteType * 5

        shapeParams =
            height: this.imageObj.clientHeight, 
            width: this.imageObj.clientWidth, 
            fill: "rgb(0,255,0)", 
            stroke: "rgb(0,0,0)",
            cornerSize: 20
        # Call fabric.Image's constructor so it can do its magic.
        super(this.imageObj, shapeParams)

    # Whatever UI event we decide should create an interaction, has occurred
    interactionEvent: (obj) ->
        console.log('Received interaction between ' + this + ' and ' + obj)
        intact = new OverlapInteraction(obj)
        this.addIRule(intact)

    applyRules: (environment) ->
        for rule in @_rules
            # call each rule's act method, supplying this sprite and
            # information about other sprites in its environment
            console.log('applying rule' + rule)
            rule.act(this, environment)

    applyIRules: (environment) ->
        for rule in @_irules
            console.log('Applying an iRule')
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

    addIRule: (rule) ->
        @_irules.push(rule)
        return @_irules.length - 1

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
        # mhewj - changed this to the image elt
        imageObj: imageObj

        # The underscore here indicates private; you aren't supposed to modify
        # the list directly. Use mySpriteInstance.addRule() instead.
        # Because the list is in the Sprite prototype, rules will apply to all
        # instances of that Sprite.
        _rules: []

        # We need to apply interaction rules AFTER the regular rules so that
        # after any transform, interaction can be detected.
        # N.B. If you find yourself adding another one of these for any
        # reason, you should probably change rules to take a rule and a
        # priority.  Seemed overly complex for now.
        _irules: []

    return Sprite

#
#
# Rules
#
# simple transform applied all the time, ignores environment
class window.Rule

    constructor: (@spriteType) ->
    
    act: (sprite, environment) ->
        console.log('Rule[' + @name + '].act: ' + sprite.spriteType)
        if @action != null
            @action.act(sprite)
        # this isn't an interaction, so just apply the rule without checking
        # anything

    # Allowable types are, well in the case statement
    setActionType: (type) ->
        @type = type
        actClass = switch type
            when 'transform' then TransformAction
            # Later we add 'Delete' and 'Clone' at least
        @action = new actClass()

    addTransform: (start, end) ->
        console.log('addTransform')
        if @type != 'transform'
            console.log('Error: addTransform called on other type of Rule')

        @action = new TransformAction()
        @action.setTransformDelta(start, end)

        
# a transform which is conditional on the environment of the sprite
class Interaction extends Rule
    constructor: (target) ->
        console.log('Interaction: New ' + target.spriteType)
        @targetType = target.spriteType
        # The type of Sprite with which we interact
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

class OverlapInteraction extends Interaction
    # This might just replace Interaction, but for now it's separate because
    # I wasn't sure if Interaction is used.  I think it is not.

    setEnvironment: (@requiredEnvironment) ->

    # Returns sprite that we interact with or false if none
    actOn: (sprite) ->
        objects = canvas.getObjects()
        for obj in objects
            console.log('checking int on ' + obj.getLeft() + ' with ' + sprite.getLeft())
            if obj == sprite
                continue
            if obj not instanceof GenericSprite
                continue
            if obj.spriteType != @targetType
                continue
            if obj.intersectsWithObject(sprite)
                return obj
        # We didn't find anything
        return false

    act: (sprite, environment) ->
        obj = this.actOn(sprite)
        if obj == false
            return false
        console.log("applying OverlapIntersection")
        canvas.remove(sprite)

#
#
# Actions - Transform, Delete, Clone, Random Transform, etc.
#     Actions handle the "what" and Rules handle the "When"
#
class Action
    # Override this function to do, well, whatever you're doing
    act: ->
        console.log("Action is an abstract class, don't use it.")

class TransformAction extends Action
    constructor: ->
        @transform = {dx:0, dy:0, dr:0, dxScale:1, dyScale: 1}

    # Takes a start and end state as returned by getObjectState
    setTransformDelta: (start, end) ->
        @transform.dxScale  = end.width - start.width
        @transform.dyScale  = end.height - start.height
        @transform.dx       = end.left - start.left
        @transform.dy       = end.top - start.top
        @transform.dr       = end.angle - start.angle

    act: (sprite) ->
        console.log('TransformAction calling act on ' + sprite)
        sprite.set({
            left: sprite.getLeft() + @transform.dx
            top: sprite.getTop() + @transform.dy
            angle: sprite.getAngle() + @transform.dr
            #width: @sprite.getWidth() * transform.dxScale
            width: sprite.getWidth() + @transform.dxScale
            #height: @sprite.getHeight * transform.dyScale
            height: sprite.getHeight() + @transform.dyScale
        })

        # Tell the sprite to update its internal state for intersect checks
        sprite.setCoords()


window.spriteList = []
window.spriteTypeList = []

window.tick = ->
    console.log('tick')
    for sprite in spriteList
        sprite.applyRules()
    for sprite in spriteList
        sprite.applyIRules()
    canvas.renderAll.bind(canvas)
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
