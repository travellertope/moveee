<?php
$line = '"In the world through which I travel, I am endlessly creating myself.","Frantz Fanon","Black Skin, White Masks"';
$data = str_getcsv($line);
print_r($data);

$line2 = '"The past is always tense, the future perfect.","Zadie Smith","White Teeth"';
$data2 = str_getcsv($line2);
print_r($data2);
