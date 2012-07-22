<?php

define('APP', __DIR__.'/server/src');
define('ROUTES', APP.'/routes');
define('VIEWS', __DIR__.'/server/views');

require_once __DIR__.'/server/vendor/autoload.php';

$app = new Silex\Application();
$app['debug'] = true;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

$app->register(new Silex\Provider\UrlGeneratorServiceProvider());
$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path' => VIEWS,
    'twig.options' => array(
    	//'cache' => VIEWS.'/cache/',
    ),
));

/**
 * Routes
 */

$app->mount('/', include ROUTES.'/front-end.php');
$app->mount('/data/terrain', include ROUTES.'/terrain.php');
$app->mount('/data/messier', include ROUTES.'/messier.php');


$app->run();
