require.config({ 
      
    jQuery: '1.7.2',

    waitSeconds: 30,
    
    paths: {
        'jquery': 'libs/jquery',
        'modernizr': 'libs/modernizr'
    },

    shim: {

        'modernizr': {

            exports: 'Modernizr'
        }
    },
    
    map: {

        '*': {
            'jquery': 'modules/adapters/jquery',
            'google/maps': 'modules/adapters/google-maps'
        },
        
        'modules/adapters/jquery': {
            'jquery': 'jquery'
        }
    }
});