var WebSocketServer = require('ws').Server
var http = require('http')
var fs = require('fs')
var url = require('url')
var path = require('path')

exports.Server = function bootstrap(s) {
    const spec = s || {}
    const port = spec.httpport || 8080
    const dirname = spec.dirname || '/public'
    
    var server = createServer(dirname)
    server.listen(port)

    console.log("http server listening on %d", port)

    const wss = new WebSocketServer({
        server: server
    })
    
    console.log("ws server listening on %d", wss.options.port || 8080)
    
    return wss
}

function createServer(dir) {
    var mimeTypes = {
        "html": "text/html",
        "jpeg": "image/jpeg",
        "jpg": "image/jpeg",
        "png": "image/png",
        "js": "text/javascript",
        "css": "text/css"
    }

    return http.createServer(function(req, res) {
        var uri = url.parse(req.url).pathname
        var unescapedUri = unescape(uri)
        if (unescapedUri === '/' || 
            (!unescapedUri.startsWith('/css/') && 
            !unescapedUri.startsWith('/js/') && 
            !unescapedUri.startsWith('/assets/') && 
            !unescapedUri.startsWith('/views/'))) unescapedUri = 'index.html'
            
        var filename = path.join(process.cwd() + dir, unescapedUri)
        var stats

        try {
            stats = fs.lstatSync(filename) // throws if path doesn't exist
        }
        catch (e) {
            res.writeHead(415, {
                'Content-Type': 'text/plain'
            })
            res.write('404 Not Found\n')
            res.end()
            return
        }


        if (stats.isFile()) {
            // path exists, is a file
            var mimeType = mimeTypes[path.extname(filename).split(".").reverse()[0]]
            res.writeHead(200, {
                'Content-Type': mimeType
            })

            var fileStream = fs.createReadStream(filename)
            fileStream.pipe(res)
        }
        else {
            res.writeHead(415, {
                'Content-Type': 'text/plain'
            })
            res.write('404 Not Found\n')
            res.end()
            return
        }

    })
}