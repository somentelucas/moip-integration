var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var Moip = require('@pocesar/moip2').Moip;
var _ = require('lodash');
var moment = require('moment');

var moip = new Moip('F4YBYJD1FABW192WO6CWREYNOQDMEYJ3', 'EF41KLNBVFACXAFZ5ST421Z878CZSTCAZFDRDOUN', false);

app.use(express.static(__dirname + '/public'));
app.use('/build', express.static(__dirname + '/build'));
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(3000, function () {
    console.log('The app is listening on port 3000!');
});

app.get('/', function (req, res) {
    res.render('index.html');
});

app.post('/create_order', function (req, res) {

    // Gerando identificadores únicos
    var uniqueIdPedido = _.uniqueId('identificador_proprop_moip_pedido_');
    var uniqueIdCliente = _.uniqueId('identificador_proprop_moip_cliente_');
    var user = req.body.user;
    var product = req.body.product;

    // Retornar erro se usuário não tiver preenchido nenhum dado
    if (!user) {
        res.send({ errors: { errors: [{ description: 'Insira seus dados' }] } });
    }

    // Formatar a dada te nascimento no formato YYYY-MM-DD
    var birthDate = user.birthDate && moment(user.birthDate).format('YYYY-MM-DD');

    // Criando o objeto com os dados de telefone
    var phoneObject = {
        countryCode: '55',
        areaCode: user.phone && user.phone.areaCode,
        number: user.phone && user.phone.number
    };

    // Criando um objeto com os dados de endereço de entrega
    var shippingAddressObject = {
        city: user.shippingAddress && user.shippingAddress.city,
        complement: user.shippingAddress && user.shippingAddress.complement,
        country: 'BRA',
        district: user.shippingAddress && user.shippingAddress.district,
        state: user.shippingAddress && user.shippingAddress.state,
        street: user.shippingAddress && user.shippingAddress.street,
        streetNumber: user.shippingAddress && user.shippingAddress.streetNumber,
        zipCode: user.shippingAddress && user.shippingAddress.zipCode
    };

    // Criando um objeto com os dados de documento pessoal
    var taxDocumentObject = {
        number: user.cpf,
        type: 'CPF'
    };

    // Criando o objeto PEDIDO que vai ser enviado como payload para a API
    var orderObject = {
        amount: {
            currency: 'BRL',
            subtotals: {
                addition: Math.round(user.addition * 100) || 0,
                discount: Math.round(user.discount * 100) || 0
            }
        },
        customer: {
            birthDate: birthDate,
            email: user.email,
            fullname: user.name,
            ownId: uniqueIdCliente,

            // usando _.pickBy nos objetos para remover atributos `undefined` ou `null`
            // pois a API dá erro e não retorna mensagem de erro quando enviamos atributos assim
            phone: _.pickBy(phoneObject),
            taxDocument: _.pickBy(taxDocumentObject),
            shippingAddress: _.pickBy(shippingAddressObject)
        },
        items: [{
            detail: '',
            price: Math.round(product.price * 100),
            product: product.name,
            quantity: 1
        }],
        ownId: uniqueIdPedido
    };

    // Chamando a API para criar o pedido
    return moip.createOrder(orderObject)
        .then(function (order) {
            res.send({ order: order, success: true });
        }).catch(function (err) {
            res.send({ errors: err })
        }).catch(console.error.bind(console));
});
app.post('/create_payment', function (req, res) {

    var holder = req.body.holder;
    var phone = req.body.holder && req.body.holder.phone;

    // Se usuário não tiver preenchido nenhum dado de holder, retornar erro
    if (!holder) {
        res.send({ errors: { errors: [{ description: 'Preencha todos os dados obrigatórios' }] } });
    }

    // Formatar a dada te nascimento no formato YYYY-MM-DD
    var birthDate = holder && holder.birthDate && moment(holder.birthDate).format('YYYY-MM-DD');

    // Criando o objeto com os dados de telefone
    var phoneObject = {
        countryCode: '55',
        areaCode: phone && phone.areaCode,
        number: phone && phone.number
    };

    // Criando um objeto com os dados de documento pessoal
    var taxDocumentObject = {
        type: 'CPF',
        number: holder.cpf
    };

    // Criando objeto com dados do holder do cartão
    var holderObject = {
        fullname: holder.fullname,
        birthdate: birthDate,

        // usando _.pickBy nos objetos para remover atributos `undefined` ou `null`
        // pois a API dá erro e não retorna mensagem de erro quando enviamos atributos assim
        taxDocument: _.pickBy(taxDocumentObject),
        phone: _.pickBy(phoneObject)
    };

    // Chamando a API para criar o pagamento
    return moip.createPayment({
        installmentCount: 1,
        statementDescriptor: "Lucas Garcia",
        fundingInstrument: {
            method: "CREDIT_CARD",
            creditCard: {
                hash: req.body.hash,
                store: true,
                holder: _.pickBy(holderObject)
            }
        }
    }, req.body.orderID)
        .then(function (payment) {
            res.send({ payment: payment, success: true });
        }).catch(function (err) {
            res.send({ errors: err });
        }).catch(console.error.bind(console));
});