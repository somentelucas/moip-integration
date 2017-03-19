module.exports = function routes ($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('root', {
            url: '/',
            views: {
                'render': {
                    template: '<moip-container/>'
                }
            }
        });

    $urlRouterProvider.otherwise('/');
};