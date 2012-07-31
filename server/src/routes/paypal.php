<?php
// paypal

$route = $app['controllers_factory'];

use Symfony\Component\HttpFoundation\Request;

$route->match('/', function (Request $request) use ($app) {

	$data = explode(',', $request->get('custom'));

	// Record data

	// $app['db']-> TODO

	$invoice = PHP_EOL.'== Data ==\n'.PHP_EOL;
	$invoice .= implode(',', array(
		$request->get('invoice'),
		$request->get('payer_email'),
		$request->get('first_name'),
		$request->get('last_name'),
		$request->get('mc_gross'),
		$request->get('mc_currency'),
		$request->get('mc_fee'),
		$request->get('txn_id'),
		$request->get('payment_date'),
		$request->get('address_name'),
		$request->get('address_street'),
		$request->get('address_city'),
		$request->get('address_state'),
		$request->get('address_country_code'),
		$request->get('custom')
	));
	$invoice .= PHP_EOL.'== //// =='.PHP_EOL;

	$message = \Swift_Message::newInstance()
		->setSubject("PAYPAL Invoice: {$request->get('invoice')}  -  Amount: \${$request->get('mc_gross')}")
		->setFrom(array('noreply@minutephysics.com'))
		->setTo(array('well.caffeinated+bbr@gmail.com'))
		->setBody($invoice);

	//$app['mailer']->send($message);
	$app['monolog']->addInfo('PAYPAL Invoice: '.$invoice);

	return '';
});

return $route;