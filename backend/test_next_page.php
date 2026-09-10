<?php

$ch = curl_init('http://localhost:3000/admin/dashboard/addstaff');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false); // Don't follow redirect so we see HTTP code
curl_setopt($ch, CURLOPT_HEADER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: {$httpCode}\n";
echo "Response headers/body snippet:\n";
echo substr($response, 0, 1000) . "\n";
