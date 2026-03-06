/**
 * --------------------------------------------------------------------------
 * single-word-search-term-excluder - Google Ads Script for SMBs
 * --------------------------------------------------------------------------
 * Author: Thibault Fayol - Consultant SEA PME
 * Website: https://thibaultfayol.com
 * License: MIT
 * --------------------------------------------------------------------------
 */
var CONFIG = { TEST_MODE: true, COST_THRESHOLD: 5.0, LOOKBACK: "LAST_30_DAYS" };
function main() {
    Logger.log("Recherche des termes de recherche en 1 mot coûtant cher sans conversion...");
    var report = AdsApp.report("SELECT Query, AdGroupId, Cost, Conversions FROM SEARCH_QUERY_PERFORMANCE_REPORT WHERE Cost > " + CONFIG.COST_THRESHOLD + " AND Conversions = 0 DURING " + CONFIG.LOOKBACK);
    var rows = report.rows();
    var count = 0;
    
    while(rows.hasNext()) {
        var row = rows.next();
        var term = row["Query"];
        var spaces = term.split(" ").length - 1;
        
        if (spaces === 0) { // Un seul mot
            Logger.log("Terme hyper-large à exclure : '" + term + "' (Coût : " + row["Cost"] + "€)");
            if (!CONFIG.TEST_MODE) {
                var agIter = AdsApp.adGroups().withIds([row["AdGroupId"]]).get();
                if (agIter.hasNext()) {
                   agIter.next().createNegativeKeyword("[" + term + "]");
                   count++;
                }
            }
        }
    }
    Logger.log("A exclu " + count + " mots trop génériques.");
}
