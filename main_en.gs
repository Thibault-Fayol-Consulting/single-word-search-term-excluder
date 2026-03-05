/**
 * single-word-search-term-excluder - Google Ads Script for SMBs
 * Author: Thibault Fayol
 */
var CONFIG = { TEST_MODE: true, COST_THRESH: 5 };
function main(){
  var report = AdsApp.report("SELECT Query, Cost FROM SEARCH_QUERY_PERFORMANCE_REPORT WHERE Impressions > 10");
  var rows = report.rows();
  while(rows.hasNext()){
    var row = rows.next();
    if(row["Query"].split(" ").length === 1 && parseFloat(row["Cost"]) > CONFIG.COST_THRESH){
       Logger.log("One-word waste: " + row["Query"]);
    }
  }
}