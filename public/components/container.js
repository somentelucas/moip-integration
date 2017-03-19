import './container.scss';
import 'angular-i18n/angular-locale_pt-br';

module.exports = ($rootScope, $mdDialog, ApiService, ProductService) => {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: require('./container.html'),
        link: ($scope) => {
            $scope.products = ProductService.get();

            // Abrir formulário de criação do pedido
            $scope.register = (product_id) => {
                $mdDialog.show({
                    controller: RegisterFormController,
                    templateUrl: require('./forms/personalData.tmpl.html'),
                    parent: angular.element(document.body),
                    clickOutsideToClose: true,
                    fullscreen: true,
                    locals: {
                        product: _.find($scope.products, { id: product_id })
                    }
                });
            };

            // Abrir formulário de criação do pagamento (aberto apenas quando é criado um pedido)
            const openBuyForm = (product, order_id, has_discount) => {
                $mdDialog.show({
                    controller: BuyFormController,
                    templateUrl: require('./forms/paymentData.tmpl.html'),
                    parent: angular.element(document.body),
                    clickOutsideToClose: false,
                    fullscreen: true,
                    locals: {
                        product: product,
                        orderID: order_id,
                        hasDiscount: has_discount
                    }
                });
            };

            const RegisterFormController = ($scope, $mdDialog, product) => {
                $scope.product = product;

                $scope.states = ('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO')
                    .split(' ')
                    .map((state) => ({abbrev: state}));

                $scope.hide = () => {
                    $mdDialog.hide();
                };

                $scope.cancel = () => {
                    $mdDialog.cancel();
                };

                // Validando cupom de desconto do usuário
                $scope.validateDiscount = () => {
                    $scope.validDiscount = $scope.user && $scope.user.discountWord === 'MOIP2017';

                    if ($scope.validDiscount) {
                        $scope.user.discount = $scope.product.price * 0.05;
                    }
                };

                // Aplicando desconto no preço exibido na tela caso usuário tenha inserido um cupom de desconto válido
                $scope.getProductPrice = (price) => {
                    return $scope.validDiscount ? (price - price * 0.05) : price;
                };

                $scope.progress =  (user) => {
                    $scope.inProgress = true;

                    // Chamando API para criar pedido
                    ApiService.post('/create_order', { user, product })
                        .then((response) => {
                            $scope.inProgress = false;

                            // Exibir erros caso API tenha retornado algum
                            if (response.errors) {
                                $scope.errors = response.errors.errors;
                            } else {
                                $scope.errors = null;
                                $mdDialog.hide();
                                openBuyForm(product, response.order.id, $scope.validDiscount)
                            }
                        });
                };


            };

            const BuyFormController = ($scope, $mdDialog, product, orderID, hasDiscount) => {
                $scope.product = product;
                $scope.validDiscount = hasDiscount;

                $scope.cancel = () => {
                    $mdDialog.cancel();
                };

                // Aplicando desconto no preço exibido na tela caso usuário tenha inserido um cupom de desconto válido
                $scope.getProductPrice = (price) => {
                    return $scope.validDiscount ? (price - price * 0.05) : price;
                };

                $scope.confirmBuy = (card) => {
                    $scope.inProgress = true;

                    // Extraindo as variáveis e transformando em string para validá-las
                    const cardNumber = card.number && card.number.toString();
                    const securityNumber = card.securityNumber && card.securityNumber.toString();
                    const expMonth = card.expirationMonth && card.expirationMonth.toString();
                    const expYear = card.expirationYear && card.expirationYear.toString();

                    // Criando o objeto do cartão para gerar o hash
                    const cc = new Moip.CreditCard({
                        number: cardNumber,
                        cvc: securityNumber,
                        expMonth: expMonth,
                        expYear: expYear,
                        pubKey: document.querySelector('#public-key').value
                    });

                    // Se o cartão é válido, chamar API para criar pagamento
                    if (cc.isValid()) {
                        ApiService.post('/create_payment', { hash: cc.hash(), orderID, holder: card.holder })
                            .then((response) => {
                                console.log(response);
                                $scope.inProgress = false;

                                // Exibir erros caso API tenha retornado algum
                                if (response.errors) {
                                    $scope.errors = response.errors.errors;
                                } else {
                                    $scope.errors = null;
                                }
                            });

                    // Se o cartão é inválido, verificar quais campos são inválidos e exibir mensagem de erro
                    } else {
                        const invalidMessages = {
                            'O número do cartão é inválido': !Moip.Validator.isValid(cardNumber),
                            'O código de segurança do cartão é inválido': !Moip.Validator.isSecurityCodeValid(cardNumber, securityNumber),
                            'A data de expiração do cartão é inválida': !Moip.Validator.isExpiryDateValid(expMonth, expYear)
                        };

                        $scope.errors = _.chain(invalidMessages)
                            .pickBy()
                            .keys()
                            .map((message) => ({description: message}))
                            .value();

                        $scope.inProgress = false;
                    }
                };
            };
        }
    }
};