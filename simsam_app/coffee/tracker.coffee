class window.Tracker
    parent: null
    element: null
    count: 0
    height: 30
    targetSprite: null
    history: [0]
    latched: false

    createElement: (sourceId, target) ->
        el = document.createElement('div')
        className = 'measure-follow'
        if (sourceId == 'iact_toggle')
            className = className + ' iact'
        else
            className = className + ' counts'
        el.className = className
        el.innerHTML = 0
        el["data-follows"] = target.spriteId
        $(el).css({
            position: 'absolute',
            width: '40px',
            height: '' + @height + 'px',
        })
        $(el).css('top', target.getTop() + target.getHeight()/2 - @height)
        $(el).css('left', target.getLeft() + target.getWidth()/2)
        $('#construction_frame').append(el)
        @element = el
        target.countElement = this

    update: ->
        top = @parent.getTop() + @parent.getHeight()/2 - @height
        left = @parent.getLeft() + @parent.getWidth() /2
        $(@element).css({top: top, left: left})
        $(@element).html(@count)

    remove: ->
        $(@element).remove()
        if @parent.measureObject == this
            @parent.measureObject = null

    # We interacted with something.  See if we care and act accordingly.
    interactCheck: ->
        if @parent.trueIntersectsWithObject(@targetSprite)
            if !@latched
                @count += 1
                @latched = true
        else
            @latched = false
        @history.push(@count)
        this.update()

