

const { google } = require('googleapis');

module.exports = {
  obterResposta: function (celula) {
    const sheets = google.sheets('v4').spreadsheets.values;
    return new Promise(function (resolve, reject) {
      sheets.get({
        // https://docs.google.com/spreadsheets/d/1H-6eJk0PfL6xYKsbOAbOsfHZ2fpjMie-ekg9m-MI-jM/edit?usp=sharing
        key: 'AIzaSyCj6UwCKiy8rqvHDf7VdPML6HpKak8N6kM',
        spreadsheetId: '1H-6eJk0PfL6xYKsbOAbOsfHZ2fpjMie-ekg9m-MI-jM',
        range: 'LUIS!' + celula
      }, (err, res) => {
        if (err) {
          reject("O API retornou um erro");
        }
        else {
          const rows = res.data.values;
          if (rows.length === 0) {
            resolve('Nenhum dado encontrado na célula');
          } else {
            resolve(rows[0].toString());
          }
        }
      });

    });

  }

}