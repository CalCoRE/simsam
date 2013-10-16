window.html5support =
    storage: ->
        try
            p = 'localStorage'
            return p of window and window[p] isnt null
        catch error
            return false

    getUserMedia: (options, successCallback, errorCallback) ->
        # manage different implementations of getUserMedia
        f = navigator.getUserMedia or navigator.webkitGetUserMedia or
            navigator.mozGetUserMedia or navigator.msGetUserMedia;

        # function as a feature detector when given no arguments
        if options is undefined then return Boolean f

        # manage different implementations of window.URL
        wrappedSuccessCallback = (stream) ->
            url = window.URL or window.webkitURL
            if url
                # Opera doesn't have window.URL and doesn't need it, so only
                # do this in some cases.
                stream = url.createObjectURL stream
            successCallback stream
            
        # do it
        f.call window.navigator, options, wrappedSuccessCallback, errorCallback
