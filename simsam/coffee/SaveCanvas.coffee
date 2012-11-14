class SaveCanvas
    imageType: "jpeg"
    
    constructor: (@url) ->
        @mime = "image/#{@imageType}"
    
    # for remembering what has been uploaded so that we don't
    # upload pointlessly
    hashList: []

    save: (canvas, formData) ->
        # values for composing the POST
        img_data = canvas.toDataURL(@mime).replace "data:#{@mime};base64,", ""
        crlf = "\r\n"
        boundaryStr = "multipart_form_boundary_" + (new Date).getTime()
        boundaryLine = "--" + boundaryStr

        kvChunk = (k, v) ->
            boundaryLine + crlf +
            "Content-Disposition: form-data; name=\"#{k}\"" +
            crlf + crlf + v
        
        # start composing the POST
        xhr = new XMLHttpRequest()
        xhr.open "POST", @url, true
        xhr.setRequestHeader "Content-Type",
            "multipart/form-data; boundary=" + boundaryStr
        
        # add the file data
        dataArray = [
            boundaryLine,
            'Content-Disposition: form-data; name="canvas_upload"; ' +
                'filename="frame.' + @imageType + '"',
            #"Content-Type: #{@mime}",
            "Content-Type: application/octet-stream",
            "",
            img_data
        ]
        
        # add the form data
        dataArray = dataArray.concat (kvChunk k, v for k, v of formData)

        # add the final boundary line
        dataArray.push boundaryLine

        #console.log "new", dataArray.join crlf

        # send the POST
        xhr.send dataArray.join crlf

window.SaveCanvas = SaveCanvas
