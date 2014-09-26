#
# File: text.sprite
# Desc: Handles functionanlity of text labels
#
class window.TextLabel extends fabric.Text
    constructor: (textBody) ->
        @closeButton = null
        @group = null

        super(textBody, {
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            fontFamily: 'Averia Sans Libre',
        })

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

        @group = new TextGroup(this, [this, cb], {left: 100, top: 100})

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
        console.log('I was selected: opacity 1')
        @closeButton.set('opacity', 1)
        canvas.renderAll()

    cleared: ->
        @closeButton.set('opacity', 0)
        canvas.renderAll()

    # Save and Load functions
    saveToJSON: ->
        jsonObj = {}
        jsonObj['fabric'] = JSON.stringify(this.toJSON())

    restoreFromJSON: (json) ->
        fabricObj = JSON.parse(json['fabric'])
        this.constructor.fromObject(fabricObj)
        this._initConfig(fabricObj)
        canvas.add(this)
        this.setCoords()

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

    shouldClose: (point) ->
        cb = @text.closeButton
        console.log ('closeClick test: L: ' + cb.getLeft() + ' T: ' + cb.getTop() + ' point: ' + point.x + ', ' + point.y)
        if (cb.containsPoint(point))
            canvas.remove(@text)
            canvas.remove(cb)
            canvas.remove(this)

