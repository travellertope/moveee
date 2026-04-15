<?php
$raw_data = '"If there\'s a book that you want to read, but it hasn\'t been written yet, then you must write it.","Toni Morrison","1981 Speech at the Ohio Arts Council"';

echo "Testing str_getcsv:\n";
$data1 = str_getcsv($raw_data);
print_r($data1);

echo "\nTesting fgetcsv with stream:\n";
$fp = fopen('php://temp', 'r+');
fwrite($fp, $raw_data);
rewind($fp);
$data2 = fgetcsv($fp);
print_r($data2);
fclose($fp);

$spaced_raw = '"Quote with, comma", "Author", "Source"';
echo "\nTesting fgetcsv with leading space in second field:\n";
$fp = fopen('php://temp', 'r+');
fwrite($fp, $spaced_raw);
rewind($fp);
$data3 = fgetcsv($fp);
print_r($data3);
fclose($fp);
