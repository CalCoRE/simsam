# Note: Due to limitations in CoffeeScript, all classes in this file must be
# prepended with "window.".

#
# Actions - Transform, Delete, Clone, Random Transform, etc.
#     Actions handle the "what" and Rules handle the "When"
#
class window.Action
    constructor: ->
    # Override this function to do, well, whatever you're doing
    act: (sprite) ->
        console.log("Action is an abstract class, don't use it.")

    restoreFromJSON: (data) ->
        # Everyone needs one, but it doesn't need to do anything

class window.DeleteAction extends Action
    act: (sprite) ->
        console.log('DeleteAction: act')
        spriteDeleteList.push(sprite)
    toJSON: ->
        object = {}
        object.type = 'delete'
        return object

class window.CloneAction extends Action
    constructor: ->

    act: (sprite) ->
        # Interact at sprite.CloneFrequency % of the time
        if (Math.random() * 100) > (sprite.cloneFrequency)
            return
        if window.spriteTypeList[sprite.spriteType]::_count >= window.maxSprites
            return
        newSprite = new window.spriteTypeList[sprite.spriteType]  # make one
        spriteList.push( newSprite )
        newSprite.setTop(sprite.getTop() + Math.random() * 76 - 38)
        newSprite.setLeft(sprite.getLeft() + Math.random() * 76 - 38)
        theta = sprite.getAngle() * Math.PI / 180
        sTop = sprite.cloneTranslate.top
        sLeft = sprite.cloneTranslate.left
        dx = sLeft * Math.cos(theta) - sTop * Math.sin(theta)
        dy = sLeft * Math.sin(theta) + sTop * Math.cos(theta)
        newSprite.setTop(sprite.getTop() + dy)
        newSprite.setLeft(sprite.getLeft() + dx)
        newSprite.setAngle(sprite.getAngle() + sprite.cloneTranslate.rotate)
        canvas.add(newSprite)
        canvas.renderAll()

    toJSON: ->
        object = {}
        object.type = 'clone'
        return object

    restoreFromJSON: (data) ->
        super()

class window.SproutAction extends Action
    @targetClassType = null     # This should be an int
    constructor: ->

    # This is similar to CloneAction's act, but in our case we spawn a
    # different object (as specified in targetClassType).
    act: (sprite) ->
        # Interact at sprite.CloneFrequency % of the time
        if (Math.random() * 100) > (sprite.cloneFrequency)
            return
        if window.spriteTypeList[sprite.spriteType]::_count >= window.maxSprites
            return
        sType = @targetClassType
        newSprite = new window.spriteTypeList[sType]  # make one
        console.log('Creating new object of type ' + sType)
        spriteList.push( newSprite )
        #newSprite.setTop(sprite.getTop() + Math.random() * 20 - 10)
        #newSprite.setLeft(sprite.getLeft() + Math.random() * 20 - 10)
        theta = sprite.getAngle() * Math.PI / 180
        sTop = sprite.cloneTranslate.top
        sLeft = sprite.cloneTranslate.left
        dx = sLeft * Math.cos(theta) - sTop * Math.sin(theta)
        dy = sLeft * Math.sin(theta) + sTop * Math.cos(theta)
        newSprite.setTop(sprite.getTop() + dy)
        newSprite.setLeft(sprite.getLeft() + dx)
        newSprite.setAngle(sprite.getAngle() + sprite.cloneTranslate.rotate)
        canvas.add(newSprite)
        newSprite.setCoords()
        canvas.renderAll()

    # Parameter should be an int representing the SpriteType
    setTarget: (targetValue) ->
        @targetClassType = targetValue

    getTarget: ->
        return @targetClassType

    toJSON: ->
        object = {}
        object.type = 'sprout'
        object.targetType = @targetClassType
        return object

    restoreFromJSON: (data) ->
        @targetClassType = data.targetType
        super()

class window.TransformAction extends Action
    constructor: ->
        @transform = {dx:0, dy:0, dr:0, dxScale:1, dyScale: 1}
        @stateRandom = false
        @randomRange = 15

    # Takes a start and end state as returned by getObjectState
    setTransformDelta: (start, end) ->
        # N.B. These don't take angle shift into account, only starting angle
        dx = end.left - start.left
        dy = end.top - start.top
        rad = start.angle * Math.PI / 180
        x = dx * Math.cos(-rad) - dy * Math.sin(-rad)
        y = -dx * Math.sin(rad) + dy * Math.cos(rad)
        @transform.dxScale  = end.width - start.width
        @transform.dyScale  = end.height - start.height
        @transform.dx       = x
        @transform.dy       = y
        @transform.dr       = end.angle - start.angle

    act: (sprite) ->
        console.log('TransformAction: ' + sprite.spriteType)
        rawAngle = sprite.getAngle()
        if @stateRandom
            range = @randomRange / 180
            theta = (sprite.getAngle() + @transform.dr) * Math.PI / 180 +
                (Math.random() * range - range / 2) * (2 * Math.PI)
        else
            theta = (sprite.getAngle() + @transform.dr) * Math.PI / 180
        if isNaN(theta)
            theta = 0
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

    toJSON: ->
        object = {}
        object.type = 'transform'
        object.stateRandom = @stateRandom
        object.randomRange = @randomRange
        object.transform   = @transform
        return object

    restoreFromJSON: (data) ->
        @stateRandom = data.stateRandom
        @randomRange = data.randomRange
        @transform = data.transform
