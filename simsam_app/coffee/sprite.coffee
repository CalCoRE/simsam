# A prototypical sprite
class GenericSprite extends fabric.Image
    transIdx = 0
    cloneIdx = 1
    # These properties will be in the prototype of the Sprite
    # and thus appear as properties of all instances of that sprite
    # Variables prefixed with @ will be properties of individual sprite
    # instances.
    constructor: (@spriteId) ->
        @stateTranspose = false
        @stateRecording = false
        @stateRandom    = false
        @randomRange    = 15
        @ruleTempObject = null
        @prepObj = null
        sWidth = this.spriteType * 5

        shapeParams =
            height: this.imageObj.clientHeight,
            width: this.imageObj.clientWidth,
            fill: "rgb(0,255,0)",
            stroke: "rgb(0,0,0)",
            cornerSize: 20
        # Call fabric.Image's constructor so it can do its magic.
        super(this.imageObj, shapeParams)

    isRandom: ->
        if @_rules.length && @_rules[0] != undefined
            action = @_rules[0].action
            return action.stateRandom
        return @stateRandom

    setRandom: (value) ->
        @stateRandom = value
        if @_rules.length
            action = @_rules[0].action
            action.stateRandom = value

    setRandomRange: (range) ->
        @randomRange = range

    isEditing: ->
        return @stateRecording

    # Whatever UI event we decide should create an interaction, has occurred
    interactionEvent: (obj) ->
        # Don't create another event if we're recording a transpose
        if @stateTranspose
            console.log("Error: interactionEvent called during Transpose")
            return
        console.log('Received interaction between ' + this + ' and ' + obj)
        # Clear recording if we thought that's what we were doing
        @stateRecording = false
        @ruleTempObject = obj
        surviveObj = this
        uiInteractionChoose(this, (choice) ->
            surviveObj.interactionCallback(choice)
        )

    # User selected the type of interaction via UI widget
    interactionCallback: (choice) ->
        console.log('Received interaction callback ' + choice)
        if choice == 'transpose'
            @stateTranspose = true
            @initState = getObjectState(this)
            @stateRecording = false

    applyRules: (environment) ->
        console.log('--Regular Rules')
        for rule in @_rules
            if rule == undefined
                continue
            # call each rule's act method, supplying this sprite and
            # information about other sprites in its environment
            console.log('applying rule' + rule)
            rule.act(this, environment)

    prepIRules: (environment) ->
        for rule in @_irules
            if rule == undefined
                continue
            @prepObj = rule.prep(this, environment)

    applyIRules: (environment) ->
        console.log('--Interaction Rules')
        for rule in @_irules
            console.log('Applying an iRule')
            # CoffeeScript design flaw requires this
            if (rule == undefined)
                continue
            rule.act(this, environment)

    # returns the index of the new rule
    addRule: (rule) ->
        # Try switching to a single rule XXX
        @_rules[0] = rule
        rule.action.stateRandom = @stateRandom
        return @_rules.length - 1

    # will complain if given a bad index
    setRule: (index, rule) ->
        @_rules[index] = rule

    # index of the irule so we overwrite duplicates
    addIRule: (rule, index) ->
        @_irules[index] = rule
        return @_irules.length - 1

    # This could go in simlite.js, but wanted to keep it with learningToggle
    addSimpleClone: ->
        r = new Rule()
        r.setActionType('clone')
        this.setRule(1, r)

    removeClone: ->
        delete this._rules[1]

    isClone: ->
        if @_rules[1] != undefined
            return true
        return false

    learningToggle: ->
        if @stateTranspose
            @stateTranspose = false
            this.showNormal()
            # Here we should record the movement as a transpose
            endState = getObjectState(this)
            r = new OverlapInteraction(@ruleTempObject)
            r.setActionType('transform')
            r.addTransform(@initState, endState)
            this.addIRule(r, @ruleTempObject.spriteType)
            return
        if not @stateRecording
            @initState = getObjectState(this)
            this.showLearning()
            @stateRecording = true
        else
            endState = getObjectState(this)
            this.showNormal()
            r = new Rule(this.spriteType)
            r.setActionType('transform')
            r.addTransform(@initState, endState)
            if this.isRandom()
                r.addRandom(@randomRange)
            this.addRule(r)
            @stateRecording = false

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
        
    # Intersects OR contains OR is contained
    trueIntersectsWithObject: (obj) ->
        if this.intersectsWithObject(obj)
            return true
        if this.isContainedWithinObject(obj)
            return true
        if obj.isContainedWithinObject(this)
            return true
        return false


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

        # Keep track of how many instances we have spawned.
        _count: 0

        constructor: (spriteType) ->
            Sprite::_count = Sprite::_count + 1
            console.log ('I have ' + @_count + ' children.')
            super(spriteType)

    return Sprite

#
#
# Rules
#
# simple transform applied all the time, ignores environment
class Rule
    constructor: (@spriteType) ->
    
    act: (sprite, environment) ->
        console.log('Rule[' + @name + '].act: ' + sprite.spriteType)
        if @action != null
            @action.act(sprite)
        # this isn't an interaction, so just apply the rule without checking
        # anything

    prep: (sprite, environment) ->
        return

    # Allowable types are, well in the case statement
    setActionType: (type) ->
        @type = type
        actClass = switch type
            when 'transform' then TransformAction
            when 'clone' then CloneAction
            # Later we add 'Delete' and 'Clone' at least
        @action = new actClass()

    addTransform: (start, end) ->
        console.log('addTransform')
        if @type != 'transform'
            console.log('Error: addTransform called on other type of Rule')

        @action = new TransformAction()
        @action.setTransformDelta(start, end)

    addRandom: (range) ->
        @action.randomRange = range
        @action.stateRandom = true

    addClone: ->
        @action = new CloneAction()

        
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

    prep: (sprite, environment) ->
        return this.actOn(sprite)

    # Returns sprite that we interact with or false if none
    actOn: (sprite) ->
        objects = canvas.getObjects()
        for obj in objects
            if obj == sprite
                continue
            if obj not instanceof GenericSprite
                continue
            if obj.spriteType != @targetType
                continue
            if obj.trueIntersectsWithObject(sprite)
                return obj
        # We didn't find anything
        return false

    act: (sprite, environment) ->
        obj = sprite.prepObj
        if obj == false
            return false
        @action.act(sprite)
        sprite.prepObj = null

#
#
# Actions - Transform, Delete, Clone, Random Transform, etc.
#     Actions handle the "what" and Rules handle the "When"
#
class Action
    constructor: ->
    # Override this function to do, well, whatever you're doing
    act: (sprite) ->
        console.log("Action is an abstract class, don't use it.")

class CloneAction extends Action
    constructor: ->
        # On average, spawn every spawnWait ticks
        @spawnWait = 2

    act: (sprite) ->
        # only act 1 out of ever @spawnWait times
        if (Math.random() * @spawnWait) > 1
            return
        if window.spriteTypeList[sprite.spriteType]::_count >= window.maxSprites
            return
        newSprite = new window.spriteTypeList[sprite.spriteType]  # make one
        spriteList.push( newSprite )
        newSprite.setTop(sprite.getTop() + Math.random() * 20 - 10)
        newSprite.setLeft(sprite.getLeft() + Math.random() * 20 - 10)
        canvas.add(newSprite)
        canvas.renderAll()

class TransformAction extends Action
    constructor: ->
        @transform = {dx:0, dy:0, dr:0, dxScale:1, dyScale: 1}
        @stateRandom = false
        @randomRange = 15

    # Takes a start and end state as returned by getObjectState
    setTransformDelta: (start, end) ->
        @transform.dxScale  = end.width - start.width
        @transform.dyScale  = end.height - start.height
        @transform.dx       = end.left - start.left
        @transform.dy       = end.top - start.top
        @transform.dr       = end.angle - start.angle

    act: (sprite) ->
        if @stateRandom
            range = @randomRange / 180
            theta = sprite.getAngle() * Math.PI / 180 +
                (Math.random() * range - range / 2) * (2 * Math.PI)
        else
            theta = sprite.getAngle() * Math.PI / 180
        dx = @transform.dx * Math.cos(theta) - @transform.dy * Math.sin(theta)
        dy = @transform.dx * Math.sin(theta) + @transform.dy * Math.cos(theta)
        sprite.set({
            left: sprite.getLeft() + dx
            top: sprite.getTop() + dy
            angle: sprite.getAngle() - @transform.dr
            #width: @sprite.getWidth() * transform.dxScale
            width: sprite.width + @transform.dxScale
            #height: @sprite.getHeight * transform.dyScale
            height: sprite.height + @transform.dyScale
        })
        # Remove this if you don't want objects to rotate visually
        sprite.setAngle(theta * 180 / Math.PI)

        # Tell the sprite to update its internal state for intersect checks
        sprite.setCoords()


window.spriteList = []
window.spriteTypeList = []

# Take another simulation step
#  First, apply simple rules
#  Second, pass to check for interactions from simple rule application
#  Third, Apply interaction rules matched by #2.
window.tick = ->
    for sprite in spriteList
        sprite.applyRules()
    for sprite in spriteList
        sprite.prepIRules()
    for sprite in spriteList
        sprite.applyIRules()
    canvas.renderAll.bind(canvas)
    canvas.renderAll()

window.loadSpriteTypes = ->
    window.maxSprites = 25
    console.log "loading sprite types"
    spriteTypeList = [] # re-init. hmm, this could get messy TODO
    $("img").each (i, sprite) -> # for each sprite in the drawer
        console.log "loading sprite type" + i
        window.spriteTypeList.push( SpriteFactory( i , sprite ) ) #make a factory
        
        $(sprite).draggable # this sprite is draggable
            revert: false, # dont bounce back after drop
            helper: "clone", # make a copy when pulled off the dragsource
            cursorAt:
                top: 0
                left: 0
            start: (e, ui) ->
                $(ui.helper).addClass("ui-draggable-helper")
            stop: (ev, ui) -> # when dropped
                if (pointWithinElement(ev.pageX, ev.pageY,
                        $('#trash_menu_button')) ||
                        pointWithinElement(ev.pageX, ev.pageY, $('#trash')) )
                    deleteImageFully(i, this)
                    return
                console.log(i); # tell me which one you are
                if window.spriteTypeList[i]::_count >= maxSprites
                    return
                newSprite = new window.spriteTypeList[i]  # make one
                spriteList.push( newSprite )
                # pos = $(this).position()
                newSprite.setTop(ev.pageY)
                newSprite.setLeft(ev.pageX)
                canvas.add(newSprite)
                canvas.renderAll();
