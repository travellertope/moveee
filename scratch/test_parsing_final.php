<?php
// Mock normalization logic from class-culture-directory-tools.php
function normalize_csv_input($raw_data) {
    $search   = array( '“', '”', '«', '»', '‘', '’', '–', '—' );
    $replace  = array( '"', '"', '"', '"', "'", "'", '-', '-' );
    $raw_data = str_replace( $search, $replace, $raw_data );
    
    // Surgical padding fix
    $raw_data = preg_replace( '/,\s+"/', ',"', $raw_data );
    
    // Normalise line endings
    $raw_data = str_replace( array( "\r\n", "\r" ), "\n", $raw_data );
    
    return $raw_data;
}

function parse_csv_stream($raw_data) {
    $raw_data = normalize_csv_input($raw_data);
    
    $stream = fopen('php://temp', 'r+');
    fwrite($stream, $raw_data);
    rewind($stream);
    
    $results = [];
    while (($data = fgetcsv($stream, 0, ',', '"')) !== false) {
        if (empty($data) || (count($data) === 1 && empty($data[0]))) continue;
        $results[] = $data;
    }
    fclose($stream);
    return $results;
}

// User's troublesome data
$sample = '"All that you touch you change. All that you change changes you. The only lasting truth is change.","Octavia E. Butler","Parable of the Sower"
"Do not be afraid to disappear. From it, from us, for a while, and see what comes to you in the silence.","Michaela Coel","2018 MacTaggart Lecture"
"Art is man\'s constant effort to create for himself a different order of reality from that which is given to him.","Chinua Achebe","Hopes and Impediments"
"The past is always tense, the future perfect.","Zadie Smith","White Teeth"
"Cinema is an evening school. People don’t go to the cinema to learn, but they learn anyway.","Ousmane Sembène","Various Interviews"';

$parsed = parse_csv_stream($sample);

echo "Results:\n";
foreach ($parsed as $i => $row) {
    echo "Row $i:\n";
    foreach ($row as $j => $field) {
        echo "  Field $j: " . substr($field, 0, 50) . (strlen($field) > 50 ? "..." : "") . "\n";
    }
}
