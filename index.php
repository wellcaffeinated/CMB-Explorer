<?php

define('APP', __DIR__.'/server/src');
define('ROUTES', APP.'/routes');
define('VIEWS', __DIR__.'/server/views');

require_once __DIR__.'/server/vendor/autoload.php';

$app = new Silex\Application();
$app['debug'] = true;

$app->register(new Silex\Provider\UrlGeneratorServiceProvider());
$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path' => VIEWS,
    'twig.options' => array(
    	//'cache' => VIEWS.'/cache/',
    ),
));

$app->register(new Silex\Provider\MonologServiceProvider(), array(
	'monolog.level' => Monolog\Logger::DEBUG,
	'monolog.logfile' => APP.'/debug.log',
));

$app->register(new Silex\Provider\DoctrineServiceProvider(), array( 
	'db.options' => array(
		'driver' =>'pdo_sqlite', 
		'path'	=> APP.'/bbr.db',
	),
));

$app->register(new Silex\Provider\SwiftmailerServiceProvider());

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Routes
 */

$app->mount('/', include ROUTES.'/front-end.php');
$app->mount('/paypal', include ROUTES.'/paypal.php');
$app->mount('/data/terrain', include ROUTES.'/terrain.php');
$app->mount('/data/messier', include ROUTES.'/messier.php');


$app->run();
