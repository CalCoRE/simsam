#
# File: text.sprite
# Desc: Handles functionanlity of text labels
#
class window.TextLabel extends fabric.Text
    constructor: (textBody) ->
        @closeButton = null
        @group = null
        @load_left = null
        @load_top = null

        super(textBody, {
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            fontFamily: 'Averia Sans Libre',
        })

    init: ->
        imgElement = document.createElement('img')
        imgElement.src = '/static/images/close-24.png'
        cb = new fabric.Image(imgElement, {
            originX:'left', originY:'top',
            left: this.getWidth() / 2 - 12,
            top: -this.getHeight() / 2,
            opacity: 0,
        })
        @closeButton = cb
        canvas.bringToFront(cb)
        # Some simple defaults
        if (@load_left == null)
            @load_left = 100
        if (@load_top == null)
            @load_top = 100
        @group = new TextGroup(this, [this, cb], {left: @load_left, top: @load_top})
        #@group = new TextGroup(this, [this, cb], {left: 100, top: 100})
        window.textList.push(this)
        console.log ('Total number of text elements ' + window.textList.length)

    # Methods
    addToCanvas: ->
        canvas.add(@group)

    # Setting Values
    setLeft: (pos) ->
        @group.setLeft(pos)

    setTop: (pos) ->
        @group.setTop(pos)

    # Canvas callbacks
    modified: ->

    selected: ->
        @closeButton.set('opacity', 1)
        canvas.renderAll()

    cleared: ->
        @closeButton.set('opacity', 0)
        canvas.renderAll()

    # Save and Load functions
    saveToJSON: ->
        jsonObj = {}
        #jsonObj['fabric'] = JSON.stringify(this.toJSON())
        jsonObj['text'] = this.getText()
        jsonObj['left'] = @group.getLeft()
        jsonObj['top'] = @group.getTop()
        console.log(jsonObj)
        return jsonObj

    restoreFromJSON: (json) ->
        @load_left = json['left']
        @load_top = json['top']
        this.setText(json['text'])
        this.setCoords()
        this.init()
        this.addToCanvas()

class window.TextGroup extends fabric.Group
    constructor: (text, list, object) ->
        @text = text
        super(list, object)
    # Canvas callbacks
    modified: ->
        @text.modified()

    selected: ->
        @text.selected()

    cleared: ->
        @text.cleared()

    setText: (text) ->
        @text.setText(text)

    getText: () ->
        @text.getText()

    # Delete the group and objects if the close button was clicked.
    shouldClose: (point) ->
        cb = @text.closeButton
        if (cb.containsPoint(point))
            canvas.remove(@text)
            canvas.remove(cb)
            canvas.remove(this)

            # Remove from global list
            idx = window.textList.indexOf(@text)
            if idx >= 0
                window.textList.splice(idx, 1)

    # Save and Load functions
    # N.B. We might not need this right now
    saveToJSON: ->
        jsonObj = {}
        jsonObj['left'] = this.getLeft()
        jsonObj['top'] = this.getTop()

    restoreFromJSON: (json) ->
        this.setLeft(json['left'])
        this.setTop(json['top'])
        canvas.add(this)
        this.setCoords()
