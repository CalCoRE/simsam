# Note: Due to limitations in CoffeeScript, all classes in this file must be
# prepended with "window.".

#
#
# Rules
#
# simple transform applied all the time, ignores environment
class window.Rule
    constructor: (@spriteType) ->
        @action = null
        @type   = ''
        @typeint = -1  # value of type as an int for array indexes
    
    act: (sprite, obj, environment) ->
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
            when 'sprout' then SproutAction
            when 'delete' then DeleteAction
        # I don't like doubling the code here, but CoffeeScript seems to
        # leave us no choice. Rewrite if there is a cleaner alternative.
        switch type
            when 'transform'
                @typeint = 0
            when 'clone'
                @typeint = 1
            when 'sprout'
                @typeint = 2
            when 'delete'
                @typeint = 3

        @action = new actClass()

    addTransform: (start, end) ->
        if @type != 'transform'
            console.log('Error: addTransform called on other type of Rule')

        @action = new TransformAction()
        @action.setTransformDelta(start, end)

    addRandom: (range) ->
        @action.randomRange = range
        @action.stateRandom = true

    addClone: ->
        @type = 'clone'
        @typeint = 1
        @action = new CloneAction()

    addSprout: ->
        @type = 'sprout'
        @typeint = 2
        @action = new SproutAction()

    addDelete: ->
        @type = 'delete'
        @typeint = 3
        @action = new DeleteAction()

    toJSON: ->
        object = {}
        object.type = 'default'
        object.internaltype = @type
        object.typeint = @typeint
        object.action = @action.toJSON()
        return object

    @createFromData: (data) ->
        className = ''
        className = switch data.type
            when 'overlap' then OverlapInteraction
            when 'interaction' then Interaction
            when 'default' then Rule
        if (data.type == 'default')
            obj = new className
        else
            obj = new className(data.targetType)

        obj.type = data.internaltype
        obj.typeint = data.typeint

        # Now build actions for this rule
        actionObj = data.action
        actClass = switch actionObj.type
            when 'transform' then TransformAction
            when 'clone' then CloneAction
            when 'sprout' then SproutAction
            when 'delete' then DeleteAction
        act = new actClass
        act.restoreFromJSON(actionObj)
        obj.action = act
        return obj

        
# a transform which is conditional on the environment of the sprite
class window.Interaction extends Rule
    constructor: (target) ->
        super (target)
        if typeof target == 'object'
            console.log('Interaction: New ' + target.spriteType)
            @targetType = target.spriteType
        else
            @targetType = target
    # The type of Sprite with which we interact
    # I imagine an environment as a object with properties corresponding to
    # spriteTypes, where the value of each is an integer indicating how many
    # sprites of that type are in the environment, e.g.
    # {star: 1, cloud: 2}
    setEnvironment: (@requiredEnvironment) ->

    act: (sprite, iObj, environment) ->
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

    toJSON: ->
        obj = super
        obj.type = 'interaction'
        obj.targetType = @targetType
        return obj

class window.OverlapInteraction extends Interaction
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

    act: (sprite, iObj, environment) ->
        if iObj == false or iObj == null
            return false
        @action.act(sprite)

    addClone: ->
        super
        # Since we're an interaction, clone each and every time

    addSprout: ->
        super

    toJSON: ->
        obj = super
        obj.type = 'overlap'
        obj.targetType = @targetType
        return obj


# Rule arrays are arrays keyed by spriteType, holding arrays of
# rule sets (by type of rule)
window.applyToRuleArray = (ruleArray, callback, data) ->
    for spriteTypeKey, ruleSet of ruleArray
        for setKey, rule of ruleSet
            rc = callback(rule, spriteTypeKey, data)
            # Abort on a return of False
            if rc == false
                return

window.ruleBuildJSON = (ruleArray, rulesOutput) ->
    for spriteTypeKey, ruleSet of ruleArray
        setArray = []
        for setKey, rule of ruleSet
            json = rule.toJSON()
            setArray[rule.typeint] = json
        rulesOutput[spriteTypeKey] = setArray

