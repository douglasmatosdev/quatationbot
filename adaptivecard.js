var fs = require('fs');
const MOEDA_BITCOIN = 0;
const MOEDA_EURO = 1;
const MOEDA_DOLAR = 2;
const atalho = "./image/btc.jpg";
const atalho1 = "./image/usd.png";
const atalho2 = "./image/eur.jpg";

module.exports = {

    MOEDA_BITCOIN,
    MOEDA_DOLAR,
    MOEDA_EURO,
    exibirCotacaoDaMoeda: function (nome_da_moeda, valor_da_moeda, tipo_de_moeda) {

        var imagem;

        switch (tipo_de_moeda) {
            case MOEDA_BITCOIN:
                try {

                    imagem = "data:image/jpg;base64," + new Buffer(fs.readFileSync(atalho)).toString('base64');

                } catch (err) {

                    console.log('Nome ou local do arquivo', atalho, 'inválio ou incorreto.');
                }
                break;
            case MOEDA_DOLAR:
                try {

                    imagem = "data:image/png;base64," + new Buffer(fs.readFileSync(atalho1)).toString('base64');

                } catch (err)
                {
                    console.log('Nome ou local do arquivo', atalho1, 'inválio ou incorreto.');
                }
                break;
            case MOEDA_EURO:
                try {

                    imagem = "data:image/jpg;base64," + new Buffer(fs.readFileSync(atalho2)).toString('base64');

                } catch (err) {

                    console.log('Nome do arquivo ou local', atalho2, 'inválido ou incorreto.');
                }
                break;
        }

        var cartao = {
            'contentType': 'application/vnd.microsoft.card.adaptive',
            'content': {
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "type": "AdaptiveCard",
                "version": "1.0",
                "body": [
                    {
                        "type": "ColumnSet",
                        "columns": [
                            {
                                "type": "Column",
                                "width": "auto",
                                "items": [
                                    {
                                        "type": "Image",
                                        "size": "small",
                                        "url": imagem
                                    }
                                ]
                            },
                            {
                                "type": "Column",
                                "width": "stretch",
                                "items": [
                                    {
                                        "type": "TextBlock",
                                        "text": "Cotação de moeda",
                                        "horizontalAlignment": "right",
                                        "isSubtle": true
                                    },
                                    {
                                        "type": "TextBlock",
                                        "text": nome_da_moeda,
                                        "horizontalAlignment": "right",
                                        "spacing": "none",
                                        "size": "large",
                                        "color": "attention"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "type": "ColumnSet",
                        "separator": true,
                        "spacing": "medium",
                        "columns": [
                            {
                                "type": "Column",
                                "width": "stretch",
                                "items": [
                                    {
                                        "type": "TextBlock",
                                        "text": "Preço",
                                        "isSubtle": true,
                                        "weight": "bolder"
                                    }
                                ]
                            },
                            {
                                "type": "Column",
                                "width": "auto",
                                "items": [
                                    {
                                        "type": "TextBlock",
                                        "text": valor_da_moeda,
                                        "horizontalAlignment": "right",
                                        "isSubtle": true,
                                        "weight": "bolder"
                                    }
                                ]
                            }
                        ]
                    }]
            }
        };

        return cartao;
    }
}