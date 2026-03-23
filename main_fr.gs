/**
 * --------------------------------------------------------------------------
 * Single-Word Search Term Excluder — Script Google Ads
 * --------------------------------------------------------------------------
 * Identifie les termes de recherche en un seul mot ayant depense au-dela
 * d'un seuil sans convertir, puis les ajoute en mots-cles negatifs
 * (exact) au niveau du groupe d'annonces.
 *
 * Auteur :  Thibault Fayol — Consultant SEA PME
 * Site :    https://thibaultfayol.com
 * Licence : MIT
 * --------------------------------------------------------------------------
 */

var CONFIG = {
  TEST_MODE: true,                      // true = log uniquement, false = ajoute les negatifs + envoie email
  EMAIL: 'contact@votredomaine.com',    // Destinataire des alertes
  COST_THRESHOLD_MICROS: 5000000,       // Depense min en micros (5 000 000 = 5,00 EUR)
  LOOKBACK: 'LAST_30_DAYS',            // Fenetre d'analyse
  MIN_IMPRESSIONS: 10                   // Impressions minimum pour considerer
};

function main() {
  try {
    Logger.log('Recherche des termes en 1 mot qui brulent du budget...');

    var query = 'SELECT search_term_view.search_term, ' +
                'metrics.cost_micros, ' +
                'metrics.clicks, ' +
                'metrics.conversions, ' +
                'metrics.impressions, ' +
                'ad_group.id, ' +
                'ad_group.name, ' +
                'campaign.name ' +
                'FROM search_term_view ' +
                'WHERE metrics.impressions > ' + CONFIG.MIN_IMPRESSIONS +
                ' AND metrics.cost_micros > ' + CONFIG.COST_THRESHOLD_MICROS +
                ' AND metrics.conversions = 0' +
                ' AND segments.date DURING ' + CONFIG.LOOKBACK;

    var rows = AdsApp.search(query);
    var exclus = [];
    var totalVerifies = 0;

    while (rows.hasNext()) {
      var row = rows.next();
      totalVerifies++;
      var term = row.searchTermView.searchTerm;
      var words = term.trim().split(/\s+/);

      if (words.length === 1) {
        var cost = (row.metrics.costMicros / 1000000).toFixed(2);
        var entry = {
          term: term,
          adGroupId: row.adGroup.id,
          adGroupName: row.adGroup.name,
          campaign: row.campaign.name,
          cost: cost,
          clicks: row.metrics.clicks
        };

        Logger.log('Terme hyper-large : "' + term + '" | ' +
                    entry.campaign + ' > ' + entry.adGroupName +
                    ' | Cout : ' + cost + ' EUR | Clics : ' + entry.clicks);

        if (!CONFIG.TEST_MODE) {
          try {
            var agIter = AdsApp.adGroups().withIds([entry.adGroupId]).get();
            if (agIter.hasNext()) {
              agIter.next().createNegativeKeyword('[' + term + ']');
              Logger.log('  -> Exclu en [' + term + ']');
            }
          } catch (exErr) {
            Logger.log('  -> Echec exclusion "' + term + '" : ' + exErr.message);
          }
        }
        exclus.push(entry);
      }
    }

    Logger.log('Verifie ' + totalVerifies + ' termes. Exclu ' +
               exclus.length + ' termes en 1 mot.');

    if (exclus.length > 0 && !CONFIG.TEST_MODE && CONFIG.EMAIL !== 'contact@votredomaine.com') {
      var lines = exclus.map(function(e) {
        return '"' + e.term + '" | ' + e.campaign + ' > ' + e.adGroupName + ' | ' + e.cost + ' EUR';
      });
      MailApp.sendEmail(CONFIG.EMAIL,
        'Alerte Termes : ' + exclus.length + ' terme(s) en 1 mot exclu(s)',
        'Les termes suivants ont ete ajoutes en negatifs :\n\n' + lines.join('\n'));
      Logger.log('Email d\'alerte envoye a ' + CONFIG.EMAIL);
    }
  } catch (e) {
    Logger.log('ERREUR FATALE : ' + e.message);
    if (!CONFIG.TEST_MODE && CONFIG.EMAIL !== 'contact@votredomaine.com') {
      MailApp.sendEmail(CONFIG.EMAIL, 'Search Term Excluder — Erreur script', e.message);
    }
  }
}
