<?php
// messier data

$route = $app['controllers_factory'];

$route->get('/', function () use ($app) {

	return file_get_contents(APP.'/messier.json');
});

return $route;