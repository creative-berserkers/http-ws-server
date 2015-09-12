'use strict'

const WebSocketServer = require('ws').Server
const http = require('http')
const fs = require('fs')
const url = require('url')
const path = require('path')

module.exports = function Bootstrap(s) {
    const spec = s || {}
    const port = spec.httpport || 8080
    const dirname = spec.dirname || '/public'

    console.log(`http server using ${dirname} as a base for sharing content`)

    const server = createServer(dirname)
    server.listen(port)

    console.log(`http server listening on ${port}`)

    const wss = new WebSocketServer({
        server: server
    })
    
    console.log(`ws server listening on ${wss.options.port || 8080}`)
    
    return wss
}

const handleError = (req, res)=>{
    res.writeHead(415, {
        'Content-Type': 'text/plain'
    })
    res.write('404 Not Found\n')
    res.end()
}

function createServer(publicDir) {
    const mimeTypes = {
        "html": "text/html",
        "jpeg": "image/jpeg",
        "jpg": "image/jpeg",
        "png": "image/png",
        "js": "text/javascript",
        "css": "text/css"
    }

    return http.createServer(function(req, res) {
        const uri = url.parse(req.url).pathname
        let decodedUri = decodeURI(uri)
        if (decodedUri === '/' || decodedUri.includes('..')){
            decodedUri = 'index.html'
        }
            
        const filename =  path.join(process.cwd() + publicDir, decodedUri)

        fs.lstat(filename, (err, stats)=>{
            if(err){
                return handleError(req, res, e)
            }
            if (stats.isFile()) {
                // path exists, is a file
                const mimeType = mimeTypes[path.extname(filename).split(".").reverse()[0]]
                res.writeHead(200, {
                    'Content-Type': mimeType
                })

                const fileStream = fs.createReadStream(filename)
                fileStream.pipe(res)
            }
            else {
                return handleError(req, res)
            }
        })
    })
}