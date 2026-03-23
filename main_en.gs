/**
 * --------------------------------------------------------------------------
 * Single-Word Search Term Excluder — Google Ads Script
 * --------------------------------------------------------------------------
 * Finds single-word search terms that spent above a threshold without
 * converting, then adds them as exact-match negatives at the ad group
 * level. These ultra-broad terms are the #1 budget leak in SMB accounts.
 *
 * Author:  Thibault Fayol — Consultant SEA PME
 * Website: https://thibaultfayol.com
 * License: MIT
 * --------------------------------------------------------------------------
 */

var CONFIG = {
  TEST_MODE: true,                      // true = log only, false = add negatives + send email
  EMAIL: 'contact@domain.com',          // Alert recipient
  COST_THRESHOLD_MICROS: 5000000,       // Min spend in micros (5 000 000 = $5.00)
  LOOKBACK: 'LAST_30_DAYS',            // Analysis window
  MIN_IMPRESSIONS: 10                   // Minimum impressions to consider
};

function main() {
  try {
    Logger.log('Scanning for single-word search terms bleeding budget...');

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
    var excluded = [];
    var totalChecked = 0;

    while (rows.hasNext()) {
      var row = rows.next();
      totalChecked++;
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

        Logger.log('Single-word wasteful term: "' + term + '" | ' +
                    entry.campaign + ' > ' + entry.adGroupName +
                    ' | Cost: $' + cost + ' | Clicks: ' + entry.clicks);

        if (!CONFIG.TEST_MODE) {
          try {
            var agIter = AdsApp.adGroups().withIds([entry.adGroupId]).get();
            if (agIter.hasNext()) {
              agIter.next().createNegativeKeyword('[' + term + ']');
              Logger.log('  -> Excluded as [' + term + ']');
            }
          } catch (exErr) {
            Logger.log('  -> Failed to exclude "' + term + '": ' + exErr.message);
          }
        }
        excluded.push(entry);
      }
    }

    Logger.log('Checked ' + totalChecked + ' terms. Excluded ' +
               excluded.length + ' single-word terms.');

    if (excluded.length > 0 && !CONFIG.TEST_MODE && CONFIG.EMAIL !== 'contact@domain.com') {
      var lines = excluded.map(function(e) {
        return '"' + e.term + '" | ' + e.campaign + ' > ' + e.adGroupName + ' | $' + e.cost;
      });
      MailApp.sendEmail(CONFIG.EMAIL,
        'Search Term Alert: ' + excluded.length + ' single-word term(s) excluded',
        'The following single-word terms were added as negatives:\n\n' + lines.join('\n'));
      Logger.log('Alert email sent to ' + CONFIG.EMAIL);
    }
  } catch (e) {
    Logger.log('FATAL ERROR: ' + e.message);
    if (!CONFIG.TEST_MODE && CONFIG.EMAIL !== 'contact@domain.com') {
      MailApp.sendEmail(CONFIG.EMAIL, 'Search Term Excluder — Script Error', e.message);
    }
  }
}
