<?php

define('APP', __DIR__.'/server/src');
define('ROUTES', APP.'/routes');

require_once __DIR__.'/server/vendor/autoload.php';

$app = new Silex\Application();
$app['debug'] = true;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

$app->register(new Silex\Provider\UrlGeneratorServiceProvider());

/**
 * Routes
 */

$app->get('/', function(Request $request) use ($app) {

	return '';

});

$app->mount('/data/terrain', include ROUTES.'/terrain.php');
$app->mount('/data/messier', include ROUTES.'/messier.php');


$app->run();
