require.config({ 
      
    jQuery: '1.7.2',

    waitSeconds: 30,
    
    paths: {
        'jquery': 'libs/jquery',
        'stapes': 'libs/stapes'
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