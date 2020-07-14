const builder = require('botbuilder');
const restify = require('restify');
const https = require("https");
const http = require('http');
require('intl');
const MEU_CARTAO = require('./adaptivecard');
const formulario = require('./googledrive');

var limiar = 0.8; // If the score is less than 0.8 is the threshold.
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`${server.name} listening to ${server.url}`);
});
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

server.post('/api/messages', connector.listen());
var inMemoryStorage = new builder.MemoryBotStorage();

var bot = new builder.UniversalBot(connector, function (session) {

    session.endDialog("Nao entendi o que vc quis dizer");

}).set('storage', inMemoryStorage);

const recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL || 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/807abd60-cc18-4bdd-9c99-75869b1c4aec?verbose=true&timezoneOffset=-360&subscription-key=83b0e1a8cd9f44adbbdf4953c66a4816&q=');
bot.recognizer(recognizer);

// Function to convert the data obtained by the API to REAL currency en.
function converterMoeda(valor) {

    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

// First dialog that is initialized as soon as the user accesses the application.
bot.on('conversationUpdate', function (activity) {
    // when user joins conversation, send welcome message
    if (activity.membersAdded) {
        activity.membersAdded.forEach(function (identity) {
            if (identity.id === activity.address.bot.id) {
                bot.beginDialog(activity.address, 'primeiro');
            }
        });
    }
});

// Dialog that is invoked by bot.on
bot.dialog('primeiro', [
    function (session) {
        // Function to read and retrieve data from a spreadsheet in Google Docs.
        formulario.obterResposta("A2").then(function (result) {
            session.send(result)
            formulario.obterResposta("A3").then(function (result) {
                builder.Prompts.text(session, result);
            }, function (err) {
                console.log("Erro tentar ler a célula A3");
            });
        }, function (err) {
            console.log("Erro tentar ler a célula A2");
        });
    },
    function (session, results) {
        formulario.obterResposta("A4").then(function (result) {
            session.send(result + `${results.response}!!!`);
            formulario.obterResposta("A5").then(function (result) {
                session.endDialog(result);
                session.beginDialog('ini'); // Call another dialogue.
            }, function (err) {
                console.log("Erro tentar ler a célula A5");
            });
        }, function (err) {
            console.log("Erro tentar ler a célula A4");
        });
    }
]).triggerAction({
    matches: 'primeiro'
});

bot.dialog('ini', [
    function (session) {
        formulario.obterResposta("A6").then(function (result) {
            builder.Prompts.text(session, result);
        }, function (err) {
            console.log("erro")
        });
    },
    function (session, results) {

        resSimNao = results.response.toLowerCase();
        resSimNao2 = resSimNao.replace(/[ã]/, "a");

        if (resSimNao2 === "sim") {
            formulario.obterResposta("A7").then(function (result) {
                session.endDialog(result);
            }, function (err) {
                console.log("Erro ao tentar ler a célula E3.");
            });
        } else if (resSimNao2 === "nao") {
            formulario.obterResposta("A8").then(function (result) {
                session.send(result);
            });
        }
    }
]).triggerAction({
    matches: 'ini'
});

bot.dialog('cotacao', [
    function (session, args) {

        if (args.intent.intents[0].score < limiar) {

            builder.Prompts.choice(session, "Você quer saber a cotação de alguma moeda?", "Sim|Não", { listStyle: builder.ListStyle.button });

        }
        else {
            var total_de_moedas;
            session.send("Espera um momentinho");
            session.send({ type: "typing" });
            if (total_de_moedas = args.intent.entities.length) {
                http.get("http://apilayer.net/api/live?access_key=67843c3dc851ddade110a113b01777c6&format=1", res => {

                    res.setEncoding("utf8");
                    let body = "";
                    res.on("data", data => {
                        body += data;
                    });
                    res.on("end", () => {
                        body = JSON.parse(body);
                        if (body.success) {

                            for (var i = 0; i < total_de_moedas; i++) {
                                if (args.intent.entities[i].type === "bitcoin") {

                                    var msg = new builder.Message(session)
                                        .addAttachment(MEU_CARTAO.exibirCotacaoDaMoeda("Bitcoin", converterMoeda(body.quotes.USDBRL / body.quotes.USDBTC), MEU_CARTAO.MOEDA_BITCOIN));
                                    session.send(msg);
                                }
                                else if (args.intent.entities[i].type === "dolar") {

                                    var msg1 = new builder.Message(session)
                                        .addAttachment(MEU_CARTAO.exibirCotacaoDaMoeda("Dólar", converterMoeda(body.quotes.USDBRL), MEU_CARTAO.MOEDA_DOLAR));
                                    session.send(msg1);
                                }
                                else if (args.intent.entities[i].type === "euro") {
                                    var msg2 = new builder.Message(session)
                                        .addAttachment(MEU_CARTAO.exibirCotacaoDaMoeda("Euro", converterMoeda(body.quotes.USDBRL / body.quotes.USDEUR), MEU_CARTAO.MOEDA_EURO));
                                    session.send(msg2);
                                }

                            }

                            session.endDialog("");
                        }
                        else {
                            session.send("Erro com o código: " + body.error.code + " tipo: " + body.error.type + " com a mensagem: " + body.error.info);
                        }

                    });
                }).on("error", (err) => {

                    session.endDialog("Não foi possível localizar a página (erro do sistema com a seguinte mensagem): " + err.message);

                });

            }
            else {

                session.endDialog("Escolha somente entre Bitcoin, dólar ou Euro");
            }
            console.log(args.intent);
        }

    },
    function (session, results) {
        console.log(results);
        var mensagem = "";
        if (results.response.entity === "Sim") {
            mensagem = "Então escolha uma moeda (dólar, euro ou Bitcoin)";
        }
        else {
            mensagem = "Desculpe. Estou em fase de treinamento e não entendi o que vc quis dizer.";
        }
        session.endDialog(mensagem);

    }
]).triggerAction({
    matches: 'cotacao'
});

bot.dialog('despedida', [
    function (session) {
        formulario.obterResposta("E2").then(function (result) {
            builder.Prompts.text(session, result);
        }, function (err) {
            console.log("erro")
        });
    },
    function (session, results) {

        // str recebe o valor results.response e converte para caixa baixa com a função toLowerCase().
        var resSimNao = results.response.toLowerCase();
        // str2 recebe o valor de str e remove a acentuação.
        var resSimNao2 = resSimNao.replace(/[ã]/, "a");

        if (resSimNao2 === "sim") { // Se resSimNao possui o valor "sim" em caixa baixa continue a execução
            formulario.obterResposta("E3").then(function (result) { // Lê a célula "E3" na tabela do Google DOCs.
                session.send(result);
            }, function (err) {
                console.log("Erro ao tentar ler a célula E3.");
            });
        } else if (resSimNao2 === "nao") {// Se resSimNao possui o valor "nao" em caixa baixa sem acento continue a execução.
            // Lê a célula "E3" na tabela do Google DOCs.
            formulario.obterResposta("E4").then(function (result) {
                session.send(result);
                formulario.obterResposta("E5").then(function (result) {
                    session.endConversation(result);
                });

            });

        }

    },


]).triggerAction({
    matches: 'despedida'
});