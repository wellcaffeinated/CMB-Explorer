<?php

use Symfony\Component\HttpFoundation\Request;

$route = $app['controllers_factory'];
$route->get('/', function (Request $request) use ($app) {

	// expecting absolut world coordinates as given by google projection
	$x = (float)$request->get('x');
	$y = (float)$request->get('y');

	$tileFactor = 8;
	$pixelWidth = 2000;
	// the location of int conversions is very finnicky...
	$data = include APP.'/land-and-sea.php';
	$x = $tileFactor * $x;
	$y = $tileFactor * $y;
	$idx = ((int)$x + $pixelWidth * (int)$y);
	$i = 0;

	// subtract each land/sea interval until we reach 0
	foreach($data as &$val){
		if (($idx -= $val) <= 0) break;
		$i++;
	}

	return $app->json(array(
		'terrain' => ($i%2 == 0)? 'sea' : 'land'
	));
});

return $route;