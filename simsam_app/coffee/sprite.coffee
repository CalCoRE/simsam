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
class GenericSprite extends Kinetic.Image
    # These properties will be in the prototype of the Sprite
    # and thus appear as properties of all instances of that sprite

    # The underscore here indicates private, you aren't supposed to modify
    # the rules of a single sprite instance, although you could.
    # Use SpriteFoo::addRule() and SpriteFoo::setRule() instead.
    _rules: []

    # Variables prefixed with @ will be properties of individual sprite
    # instances.
    constructor: (@spriteId) ->
        # Kinetic.Rect isn't a coffeescript class, so we can't just call
        # super, unfortunately. This is almost as good.
        img = new Image();
        img.src = 'http://' + window.location.host + '/media/sprites/' + this.imageId + '.jpg'
        
        if this.imageId != undefined
          imgWidth = img.width
          imHeight = img.height
          wOff = img.width / 2
          hOff = img.height / 2
        else
          imgWidth = 100
          imgHeight = 50
          wOff = 50
          hOff = 25
        
        shapeParams =
            x: 50
            y: 50
            width: imgWidth # todo: based on image
            height: imgHeight # todo: based on image
            fill: 'black' # todo: the image
            image: img
            strokeWidth: 0
            draggable: true
            offset: [ wOff , hOff ] # IMPORTANT: this should be half the height and half the width, which allows rotation about the center of the shape 
        Kinetic.Image.call(this, shapeParams)

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

    applyTransform: (transform) ->
        this.setX(this.getX() + transform.dx)
        this.setY(this.getY() + transform.dy)
        this.rotate(transform.dr)
        scale = this.getScale()
        this.setScale(scale.x * transform.dxScale, scale.y * transform.dyScale)

# makes classes for different types of sprites
SpriteFactory = (spriteType, imageId) ->
    # a particular kind of sprite, with its own name and image file
    class Sprite extends GenericSprite
        # String, a name for this type of sprite
        spriteType: spriteType

        # String, the hash id of the jpg
        imageId: imageId

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
        for p, v of defaultTransform
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
    for sprite in window.spriteList
        sprite.applyRules()
    window.layer.draw()


window.loadSpriteTypes = ->
    console.log "loading sprite types"
    spriteTypeList = [] # re-init. hmm, this could get messy TODO
    $("#sprite_drawer *").each (i, sprite) ->
        spriteTypeList.push( SpriteFactory( $(sprite).attr("data-frame-id") , $(sprite).attr("data-frame-id") ) )
        $(sprite).dblclick -> 
            console.log "sprite ", $(sprite).attr("data-frame-id"),  " added"
            # this should be ok now because they've been pished in the right order? hmm...
            newSprite = new spriteTypeList[i] 
            layer.add( newSprite )
            spriteList.push( newSprite )
            layer.draw()

#################

window.init = ->
    window.Star = SpriteFactory('Star')
    window.starA = new Star('A')
    window.spriteList.push(starA)
    layer.add(starA)

    stage.add(layer)

    moveRight = new Rule()
    moveRight.setTransform({dx: 10})
    #Star::addRule(moveRight)

    moveDown = new Rule()
    moveDown.setTransform({dy: 10})
    #Star::addRule(moveDown)

    spin = new Rule()
    spin.setTransform({dr: Math.PI/6})
    #Star::addRule(spin)

    stretchy = new Rule()
    stretchy.setTransform({dyScale: 1.1})
    Star::addRule(stretchy)
