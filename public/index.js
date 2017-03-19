import angular from 'angular';
import 'angular-ui-router';
import 'angular-material';
import 'angular-material/angular-material.scss';
import moment from 'moment';

const moipApp = angular.module('moipApp', ['ui.router', 'ngMaterial']);

module.exports = moipApp;

moipApp.config(require('./routes/routes'));
moipApp.directive('moipContainer', require('./components/container'));
moipApp.service('ApiService', require('./services/api.service'));
moipApp.service('ProductService', require('./services/product.service'));


moipApp.config(($mdDateLocaleProvider) => {
    $mdDateLocaleProvider.formatDate = (date) => {
        var m = moment(date);
        return m.isValid() ? m.format('DD/MM/YYYY') : '';
    };
});
