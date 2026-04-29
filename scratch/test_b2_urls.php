<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Providers\B2Service;

$b2 = new B2Service();
$urls = [];

echo "Requesting 5 upload URLs in rapid succession...\n";
for ($i = 0; $i < 5; $i++) {
    $res = $b2->getUploadUrl(true);
    $urls[] = $res['authorizationToken'];
    echo "URL $i: " . substr($res['authorizationToken'], 0, 20) . "...\n";
}

$unique = array_unique($urls);
echo "\nUnique URLs found: " . count($unique) . " out of 5\n";

if (count($unique) < 5) {
    echo "WARNING: B2 is returning duplicate tokens for rapid requests!\n";
}
