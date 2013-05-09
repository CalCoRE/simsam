window.html5support =
    storage: ->
        try
            p = 'localStorage'
            return p of window and window[p] isnt null
        catch error
            return false
    getUserMedia: ->
        if navigator.getUserMedia then true else false