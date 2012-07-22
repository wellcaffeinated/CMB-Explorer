<?php

/* routes for frontend templates */

$route = $app['controllers_factory'];

$route->get('/', function () use ($app) {

	return $app['twig']->render('home.twig');
});

$route->get('/explore', function () use ($app) {

	return $app['twig']->render('explore.twig');
});

return $route;