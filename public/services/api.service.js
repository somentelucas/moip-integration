import _ from 'lodash';

module.exports = function ($http, $q) {

    const convertObjectToUrlParamString = (object) => {
        return _.reduce(object, (prev, val, prop, index) => {
            let ampersand = '&';
            if (index === 0) ampersand = '';
            return _.reduce([].concat(val), (param, item) => {
                return param + prop + '=' + item + ampersand;
            }, prev);
        }, '?');
    };

    this.post = (url, params) => {
        const deferred = $q.defer();

        $http({
            method: 'POST',
            url: url,
            data: params
        }).then((response) => {
            return deferred.resolve(response.data);
        }, (e) => {
            return deferred.reject(e);
        });

        return deferred.promise;
    };
};
