# File: sprite.coffee
# Desc: Sprite classes and the functions that handle ticks, removal, etc.
#

c_sproutRule = 2  # Set this to 2 if it should co-exist with transform
c_cloneRule  = 1  # Set this to 1 if it should co-exist with transform

# A prototypical sprite
class window.GenericSprite extends fabric.Image
    # These properties will be in the prototype of the Sprite
    # and thus appear as properties of all instances of that sprite
    # Variables prefixed with @ will be properties of individual sprite
    # instances.
    constructor: (@spriteId) ->
        @uniqueId       = ''
        @spriteTypeId = -1
        @stateTranspose = false
        @stateRecording = false
        @stateRandom    = false
        @randomRange    = 15
        @ruleTempObject = null
        @tempRandom     = false
        @tempRandomRange = 15
        @prepObj        = {}
        @prePrepObj     = {}
        @countElement   = null
        # Don't forget to add these to the save/load routines
        sWidth = this.spriteType * 5

        @uniqueId = generateUUID()

        if (this.imageObj.dataset.origHeight != undefined)
            myHeight = this.imageObj.dataset.origHeight
        else
            myHeight = this.imageObj.clientHeight
        if (this.imageObj.dataset.origWidth != undefined)
            myWidth = this.imageObj.dataset.origWidth
        else
            myWidth = this.imageObj.clientWidth

        myWidth = parseInt(myWidth)
        myHeight = parseInt(myHeight)

        shapeParams =
            height: myHeight,
            width: myWidth,
            borderColor: "rgb(37,58,79)",
            cornerColor: "rgb(37,58,79)",
            transparentCorners: false,
            cornerSize: 20
        # Call fabric.Image's constructor so it can do its magic.
        super(this.imageObj, shapeParams)

    setSpriteTypeId: (type) ->
        if(type >= 0 || type != 'undefined')
            @spriteType = type
            return true
        else
            return false
    
    getSpriteTypeId: ->
        return @spriteType

    # States

    isRandom: ->
        if @_rules.length && @_rules[0] != undefined
            action = @_rules[0].action
            return action.stateRandom
        return @stateRandom

    showRandom: ->
        if @stateTranspose
            return @tempRandom
        return this.isRandom()

    setRandom: (value) ->
        # We got set to random while recording an interaction
        if @stateTranspose
            @tempRandom = value
            return
        @stateRandom = value
        if @_rules.length && @_rules[0] != undefined
            action = @_rules[0].action
            action.stateRandom = value

    setRandomRange: (range) ->
        # Interaction
        if @stateTranspose
            @tempRandomRange = range
            return
        # Normal Transpose
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
        console.log('This.id = '+@.spriteType)
        console.log('Obj.id = '+obj.spriteType)

        # Clear recording if we thought that's what we were doing
        @stateRecording = false
        @ruleTempObject = obj
        @stateTranspose = true  # So that interaction transpose always works
        surviveObj = this
        uiInteractionChoose(this, (choice) ->
            surviveObj.interactionCallback(choice)
        )

    # User selected the type of interaction via UI widget
    interactionCallback: (choice) ->
        console.log('interaction Choice = '+choice+' Line 118 sprite.coffee')

        # All choices of a behavior clear existing behaviors the first time
        if choice != 'close' and window.interactionFirst
            window.interactionFirst = false
            this.clearIRules()
            console.log("rules cleared")

        # Setup states as appropriate for each type
        if choice == 'transpose'
            @stateTranspose = true
            @initState = getObjectState(this)
            @stateRecording = false
        else if choice == 'close'
            @stateTranspose = false
            @stateRecording = false
            this.showNormal()
        else if choice == 'clone'
            r = new OverlapInteraction(@ruleTempObject)
            r.addClone()
            this.addIRule(r, @ruleTempObject.spriteType)
            #@stateTranspose = false
            #@stateRecording = false
            #this.showNormal()
        else if choice == 'delete'
            r = new OverlapInteraction(@ruleTempObject)
            r.addDelete()
            this.addIRule(r, @ruleTempObject.spriteType)
            @stateRecording = false
            @stateTranspose = false
            this.showNormal()

    # Rule execution
    applyRules: (environment) ->
        console.log('--Regular Rules')
        for rule in @_rules
            if rule == undefined
                continue
            # call each rule's act method, supplying this sprite and
            # information about other sprites in its environment
            console.log('applying rule' + rule)
            rule.act(this, environment)

    # Determine the object we interact with (if any) and determine if that
    # object is latched from the last interaction (then ignore it)
    ###
    prepIRules: (environment) ->
        for spriteTypeKey, ruleSet of @_irules
            for setKey, rule of ruleSet
                console.log('Rule = '+rule)
                if rule == undefined
                    continue
                console.log('@prepObj = '+@prepObj)
                @prepObj = this
                @prepObj[spriteTypeKey] = rule.prep(this, environment)
                # Latch if we are still interacting with the same object 
                if @prepObj[spriteTypeKey] == @prePrepObj[spriteTypeKey]
                    @prepObj[spriteTypeKey] = null
                else if @prepObj[spriteTypeKey] == false
                    @prePrepObj[spriteTypeKey] = null
    ###

    prepIRules: (environment) ->
        console.log('applyToRuleArray')
        self = this
        applyToRuleArray(@_irules, ((x,y,z) -> self._prepIRules(x,y,z)), environment)

    _prepIRules: (rule, spriteTypeKey, environment) ->
        if rule == undefined
            return True  # Continue
        #@prepObj[spriteTypeKey] = this
        @prepObj[spriteTypeKey] = rule.prep(this, environment)
        # Latch if we are still interacting with the same object 
        if @prepObj[spriteTypeKey] == @prePrepObj[spriteTypeKey]
            @prepObj[spriteTypeKey] = null
        else if @prepObj[spriteTypeKey] == false
            @prePrepObj[spriteTypeKey] = null
        
    applyIRules: (environment) ->
        console.log('--Interaction Rules[' + @_irules.length)
        self = this
        applyToRuleArray(@_irules, ((x,y,z) -> self._applyIRules(x,y,z)), environment)
        # Reset @prepObj for each spriteTypeKey we support
        for spriteTypeKey, ruleSet of @_irules
            if @prepObj[spriteTypeKey]
                @prePrepObj[spriteTypeKey] = @prepObj[spriteTypeKey]
            @prepObj[spriteTypeKey] = null
        this.historyTick()

    _applyIRules: (rule, spriteTypeKey, environment) ->
        if @countElement
            @countElement.interactCheck()
        console.log('Applying an iRule')
        console.log(JSON.stringify(rule, null, true))
        rule.act(this, @prepObj[spriteTypeKey], environment)
        return true

    # returns the index of the new rule
    addRule: (rule) ->
        # Try switching to a single rule XXX
        @_rules[0] = rule
        rule.action.stateRandom = @stateRandom
        window.save()
        return @_rules.length - 1

    # will complain if given a bad index
    setRule: (spriteType, rule) ->
        ruleIntType = rule.typeint
        @_rules[spriteType][ruleIntType] = rule
        window.save()

    # index of the irule so we overwrite duplicates
    addIRule: (rule, spriteType) ->
        ruleIntType = rule.typeint
        if typeof @_irules[spriteType] != 'object' or
                ! Array.isArray(@_irules[spriteType])
            @_irules[spriteType] = []
        @constructor.addClassIRule(rule, spriteType)
        #@_irules[spriteType][ruleIntType] = rule
        window.save()
        return @_irules.length - 1

    clearIRules: () ->
        #shorthand for this
        this.clearClassIRules()

    # Clones

    # This could go in simlite.js, but wanted to keep it with learningToggle
    addSimpleClone: ->
        console.log('Adding Simple Clone')
        r = new Rule()
        r.setActionType('clone')
        this.setRule(c_cloneRule, r)

    removeClone: ->
        console.log('Removing Clone')
        delete this._rules[c_cloneRule]

    isClone: ->
        # Use this if we allow multiple rules
        #if @_rules[1] != undefined
        #    return true
        if @_rules[0] != undefined and typeof @_rules[0].type == 'clone'
            return true
        return false

    addSprout: ->
        r = new Rule()
        r.setActionType('sprout')
        this.setRule(c_sproutRule, r)

    setSproutTarget: (targetValue) ->
        r = this._rules[c_sproutRule]
        r.action.setTarget(targetValue)

    getSproutTarget: ->
        r = this._rules[c_sproutRule]
        return r.action.getTarget()

    removeSprout: ->
        if this._rules[c_sproutRule] != undefined and
                this._rules[c_sproutRule].type == 'sprout'
            delete this._rules[c_sproutRule]

    isSprout: ->
        if @_rules[c_sproutRule] != undefined and
                typeof @_rules[c_sproutRule].type == 'sprout'
            return true
        return false

    learningToggle: ->
        console.log('learningToggle was: ' + @stateRecording ? 'true' : 'false')
        if @stateTranspose
            @stateTranspose = false
            this.showNormal()
            # Here we should record the movement as a transpose
            endState = getObjectState(this)
            r = new OverlapInteraction(@ruleTempObject)
            r.setActionType('transform')
            r.addTransform(@initState, endState)
            if @tempRandom
                r.addRandom(@tempRandomRange)
                @tempRandom = false
            this.addIRule(r, @ruleTempObject.spriteType)
            return
        if not @stateRecording
            @initState = getObjectState(this)
            this.showLearning()
            @stateRecording = true
        else
            endState = getObjectState(this)
            this.showNormal()
            if not g_recordingClone
                r = new Rule(this.spriteType)
                r.setActionType('transform')
                r.addTransform(@initState, endState)
                if this.isRandom()
                    r.addRandom(@randomRange)
                this.addRule(r)
            @stateRecording = false
            window.save()

    showLearning: ->
        this.set({
            borderColor: "rgb(98,192,4)",
            cornerColor: "rgb(98,192,4)",
            transparentCorners: false,
        })
        canvas.renderAll();
    
    showNormal: ->
        this.set({
            borderColor: "rgb(37,58,79)",
            cornerColor: "rgb(37,58,79)",
            transparentCorners: false,
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

    isOnCanvas: ->
        canvas = $('#container')
        height = $(canvas).height()
        width = $(canvas).width()
        bound = this.getBoundingRect()
        if (bound.width + bound.left) < 0
            return false
        if (bound.height + bound.top) < 0
            return false
        if (bound.left > width)
            return false
        if (bound.top > height)
            return false
        return true

    removeFromList: ->
        idx = spriteList.indexOf(this)
        if idx >= 0
            spriteList.splice(idx, 1)
            this.subtractCount()

    remove: ->
        if @countElement != null
            @countElement.remove()
            @countElement = null
        super()

    modified: ->
        if @countElement != null
            @countElement.update()
            canvas.renderAll()

    #
    # Saving Object
    #
    saveToJSON: ->
        jsonObj = {}
        fabricJSON = JSON.stringify(this.toJSON())
        jsonObj['fabric'] = fabricJSON
        jsonObj['uniqueId'] = @uniqueId
        jsonObj['stateTranspose'] = @stateTranspose
        jsonObj['stateRecording'] = @stateRecording
        jsonObj['stateRandom'] = @stateRandom
        jsonObj['randomRange'] = @randomRange
        jsonObj['tempRandom'] = @tempRandom
        jsonObj['tempRandomRange'] = @tempRandomRange
        jsonObj['countElement'] = (@countElement == null) ? '0' : '1'

        jsonObj['spriteType'] = @spriteType
        # We shouldn't ever save amidst a tick execution
        #jsonObj['prepObj'] = @prepObj
        # XXX This seems like a really bad idea
        #@ruleTempObject = null
        #@tempRandomRange = 15
        #@prepObj = null
        
        #console.log(jsonObj)
        #console.log("L: " + this.getLeft() + " T: " + this.getTop())
        return jsonObj

    restoreFromJSON: (json) ->
        fabricObj = JSON.parse(json['fabric'])
        this.constructor.fromObject(fabricObj)
        this._initConfig(fabricObj)
        canvas.add(this)
        console.log("Rest L: " + this.getLeft() + " T: " + this.getTop())
        @uniqueId = json['uniqueId']
        @stateTranspose = false
        @stateRecording = false
        @stateRandom = json['stateRandom']
        @randomRange = json['randomRange']
        @spriteType = json['spriteType']
        this.setCoords()
#end of GenericSprite

# makes classes for different types of sprites
SpriteFactory = (spriteType, imageObj) ->
    console.log "sprite factory" + spriteType + imageObj.src
    # a particular kind of sprite, with its own name and image file
    class Sprite extends GenericSprite
    
        console.log "class sprite"
        # String, a name for this type of sprite
        spriteType: spriteType

        # String, the hash id of the jpg
        # mhewj - changed this to the image elt
        imageObj: imageObj

        hash: imageObj.dataset.hash

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
        # _irules is now a multi-dimensional array [spriteType][ruleType]
        _irules: []

        # Keep track of how many instances we have spawned.
        _count: 0

        # Count history
        _history: []

        # If we're creating a clone, where do we put it
        cloneTranslate: {top: 0, left: 0, rotate: 0}
        cloneFrequency: 100
        
        # N.B. If you are adding new attributes that should be saved, 
        # see window.saveSprites for storing those attributes.

        constructor: (spriteType) ->
            #console.log('SpriteType = '+spriteType)
            Sprite::_count = Sprite::_count + 1
            hash = @imageObj.dataset['hash']
            $('#' + hash).html(Sprite::_count)

            @myOpt = JSON.parse(JSON.stringify(window.sparkOpt))
            @myOpt['width'] = '22px'
            chash = '#' + 'chart-' + hash
            $(chash).sparkline(Sprite::_history, @myOpt)
            super(spriteType)

        subtractCount: ->
            Sprite::_count = Sprite::_count - 1
            hash = @imageObj.dataset['hash']
            $('#' + hash).html(Sprite::_count)
            chash = '#' + 'chart-' + hash
            $(chash).sparkline(Sprite::_history, @myOpt)

        getHistory: ->
            return Sprite::_history

        clearHistory: ->
            Sprite::_history = []

        historyTick: ->
            Sprite::_history.push(Sprite::_count)
            hash = @imageObj.dataset['hash']
            $('#' + hash).html(Sprite::_count)
            chash = '#' + 'chart-' + hash
            $(chash).sparkline(Sprite::_history, @myOpt)

        # These should only be used for loading objects from JSON
        @addClassRule: (rule, idx) ->
            if idx == undefined
                idx = 0
            Sprite::_rules[idx] = rule

        @addClassIRule: (rule, spriteTypeKey) ->
            if Sprite::_irules[spriteTypeKey] == undefined
                Sprite::_irules[spriteTypeKey] = []
            if spriteTypeKey == undefined
                spriteTypeKey = 0
            ruleIntType = rule.typeint
            Sprite::_irules[spriteTypeKey][ruleIntType] = rule

        clearClassIRules: () ->
            for idx,rule of Sprite::_irules
                Sprite::_irules[idx] = []

        setCloneOffset: (topVal, leftVal, rotate) ->
            Sprite::cloneTranslate.top = topVal
            Sprite::cloneTranslate.left = leftVal
            Sprite::cloneTranslate.rotate = rotate

        # Out of 100, so 1 out of 2 would be 50
        setCloneFrequency: (freq) ->
            Sprite::cloneFrequency = freq

        # toJSON see window.saveSprites

        reset: ->
            Sprite::clearHistory()
            Sprite::_irules = []
            Sprite::_rules = []

    return Sprite


#
# Global Functionality - ticking and so forth
#

window.spriteList = []
window.spriteTypeList = []
window.spriteDeleteList = []
window.textList = []

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
    for sprite in spriteList
        if not sprite.isOnCanvas()
            spriteDeleteList.push(sprite)
    # post-process removes so we don't kill the list while executing
    for sprite in spriteDeleteList
        sprite.removeFromList()
        sprite.remove()
    canvas.renderAll.bind(canvas)
    canvas.renderAll()

setSpriteTypeDraggable = (sprite, input_type) ->
    $(sprite).draggable # this sprite is draggable
        revert: false, # dont bounce back after drop
        #helper: "clone", # make a copy when pulled off the dragsource
        helper: (e) ->
            target = e.target
            el = document.createElement('img')
            el.src = target.src
            return el
        cursorAt:
            top: 0
            left: 0
        start: (e, ui) ->
            $(ui.helper).addClass("ui-draggable-helper")
        stop: (ev, ui) -> # when dropped
            type = input_type
            if (pointWithinElement(ev.pageX, ev.pageY,
            $('#trash_menu_button')) ||
            pointWithinElement(ev.pageX, ev.pageY, $('#trash')) )
                console.log('I am within the Trash Sprite Button')
                deleteImageFully(type, this)
                return
            console.log('I am a '+type); # tell me which one you are
            dropX = ev.pageX - window.globalPos.left
            dropY = ev.pageY - window.globalPos.top
            st = getSpriteType(type)
            if st::_count >= window.maxSprites
                return
            console.log('Before new window.spriteTypeList[i]'+type)
            newSprite = new window.spriteTypeList[type]  # make one
            newSprite = new getSpriteType(type)
            console.log('After new window.spriteTypeList[i]'+type)
            console.log('SpriteType Success? = ' + newSprite.setSpriteTypeId( type ))
            spriteList.push( newSprite )
            # pos = $(this).position()
            newSprite.setTop(ev.pageY)
            newSprite.setLeft(dropX)
            canvas.add(newSprite)
            canvas.renderAll()
            window.save()

window.addOneSprite = (i, sprite) ->
        window.spriteTypeList.push( SpriteFactory( i , sprite ) ) #make a factory
        setSpriteTypeDraggable(sprite, i)


window.loadSpriteTypes = ->
    window.maxSprites = 25
    console.log "loading sprite types"
    # Adding window. fixes a bug I can't remember. However, adding it
    # causes sprite behaviors to apply to objects not classes.
    window.spriteTypeList = [] # re-init. hmm, this could get messy TODO
    $("#sprite_drawer > img").each (i, sprite) -> # all sprites in the drawer
        console.log "loading sprite type" + i
        sprite.setAttribute('data-sprite-type', i)
        sprite.setAttribute('data-debug', 'lST')
        window.spriteTypeList.push( SpriteFactory( i , sprite ) ) #make a factory
        setSpriteTypeDraggable(sprite, i)

    console.log("--- Loaded sprite type list: " + window.spriteTypeList.length)
    window.spriteTypesLoaded = true

window.saveSprites = ->
    masterObj = {}
    typeObjects = []
    for type in spriteTypeList
        oneType = {}
        oneType.type = type::spriteType
        oneType.imageObj = type::imageObj.src
        oneType.count = type::_count
        oneType.rules = []
        oneType.cloneTranslate = type::cloneTranslate
        oneType.cloneFrequency = type::cloneFrequency
        for rule in type::_rules
            if rule == undefined
                continue
            ruleJSON = rule.toJSON()
            oneType.rules.push(ruleJSON)
        irulesSub = []
        ruleBuildJSON(type::_irules, irulesSub)
        oneType.irules = irulesSub
        typeObjects.push(oneType)
    masterObj.classObjects = typeObjects

    objects = []
    for obj in spriteList
        objects.push(obj.saveToJSON())
    masterObj.objects = objects

    textElements = []
    for obj in textList
        textElements.push(obj.saveToJSON())
    masterObj.textElements = textElements

    string = JSON.stringify(masterObj)
    $('#data').html(JSON.stringify(masterObj, null, 4))

    return string

window.clearEverything = ->
    # Clear everything
    tmpList = []
    for sprite in window.spriteList
        tmpList.push(sprite)
    for sprite in tmpList
        sprite.removeFromList()
        sprite.remove()
    tmpTextList = []
    for text in window.textList
        tmpTextList.push(text)
    for text in tmpTextList
        if text.group != undefined
            canvas.remove(text.group)
    window.textList = []
    for spriteType in window.spriteTypeList
        spriteType.prototype.reset()
    canvas.renderAll()

# Load sprites from the JSON stored in the database
window.loadSprites = (dataString) ->
    inObject = JSON.parse(dataString)

    # If we got an empty save, don't erase everything else
    if inObject.classObjects.length == 0 and
        inObject.objects.length == 0
            return

    # Clear even type type list
    window.spriteTypeList = []
    clearEverything()

    imageObjects = []
    $("#sprite_drawer > img").each (i, sprite) -> # all sprites in the drawer
        imageObjects.push(this)
        setSpriteTypeDraggable(sprite, i)
        sprite.setAttribute('data-sprite-type', i)
        sprite.setAttribute('data-debug', 'lS')
    for typeObj in inObject.classObjects
        imgSrc = typeObj.imageObj
        for img in imageObjects
            console.log("ImgSrc: " + imgSrc + " img.src: " + img.src)
            if imgSrc == img.src
                typeObj.raw = img
                break
        console.log('typeObj.type = '+typeObj.type+' typeObj.raw = '+typeObj.raw)
        typeFactory = SpriteFactory(typeObj.type, typeObj.raw)
        typeFactory::_count = 0
        typeFactory::cloneTranslate = typeObj.cloneTranslate
        typeFactory::cloneFreqency = typeObj.cloneFreqency
        for idx, ruleData of typeObj.rules
            rule = Rule.createFromData(ruleData)
            typeFactory.addClassRule(rule, idx)
        for spriteTypeKey, iruleData of typeObj.irules
            for ruleTypeKey, ruleJSON of iruleData
                if ruleJSON == null
                    continue
                rule = Rule.createFromData(ruleJSON)
                typeFactory.addClassIRule(rule, spriteTypeKey)
        window.spriteTypeList.push(typeFactory)
    for obj in inObject.objects
        newSprite = new window.spriteTypeList[obj.spriteType]  # make one
        newSprite.restoreFromJSON(obj)
        window.spriteList.push(newSprite)

    if (inObject.textElements != undefined)
        for txt in inObject.textElements
            newText = new TextLabel('Default')
            newText.restoreFromJSON(txt)
            # Don't push to the list, constructor does it

    console.log("---- Here are our sprites ----")
    for obj in window.spriteTypeList
        if (obj.src != undefined)
            console.log(obj.src())

    canvas.renderAll()
    window.spriteTypesLoaded = true

# Retrieves the appropriate spriteType. You should use this instead of
# x = spriteTypeList[type], because after deletes and inserts the spriteType
# may no longer match the index into the array
window.getSpriteType = (type) ->
    for idx,spriteType of spriteTypeList
        if spriteType::spriteType == type
            console.log("getSpriteType[#{idx}]: #{type}")
            return spriteType
    return undefined
