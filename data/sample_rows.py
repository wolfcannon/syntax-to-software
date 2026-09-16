# Sample rows, shaped exactly as the real data arrives.
# The Census API returns a list of lists with a header row, all strings.
# Step 13 replaces this cell with the full CSVs in data/.

acs_raw = [
    ["NAME", "B08301_001E", "B08301_018E", "B08301_018M", "B08301_019E", "B08301_021E", "state", "county", "tract", "block group"],
    ["Block Group 2, Census Tract 3101.03, Marion County, Indiana", "401", "-666666666", "-666666666", "0", "22", "18", "097", "310103", "2"],
    ["Block Group 2, Census Tract 3102.01, Marion County, Indiana", "0", "0", "14", "0", "0", "18", "097", "310201", "2"],
    ["Block Group 3, Census Tract 3103.08, Marion County, Indiana", "57", "4", "13", "9", "9", "18", "097", "310308", "3"],
    ["Block Group 2, Census Tract 3201.07, Marion County, Indiana", "684", "0", "14", "18", "42", "18", "097", "320107", "2"],
    ["Block Group 1, Census Tract 3306, Marion County, Indiana", "348", "0", "14", "4", "18", "18", "097", "330600", "1"],
    ["Block Group 3, Census Tract 3401.1, Marion County, Indiana", "1303", "21", "25", "56", "71", "18", "097", "340110", "3"],
    ["Block Group 3, Census Tract 3417, Marion County, Indiana", "184", "3", "16", "10", "16", "18", "097", "341700", "3"],
    ["Block Group 1, Census Tract 3535, Marion County, Indiana", "771", "0", "14", "44", "49", "18", "097", "353500", "1"],
    ["Block Group 1, Census Tract 3562, Marion County, Indiana", "458", "18", "24", "22", "21", "18", "097", "356200", "1"],
    ["Block Group 2, Census Tract 3603.01, Marion County, Indiana", "287", "2", "15", "6", "9", "18", "097", "360301", "2"],
    ["Block Group 1, Census Tract 3703.02, Marion County, Indiana", "1303", "0", "14", "19", "66", "18", "097", "370302", "1"],
]

walk_raw = [
    ["STATEFP", "COUNTYFP", "TRACTCE", "BLKGRPCE", "NatWalkInd", "D2A_Ranked", "D2B_Ranked", "D3B_Ranked", "D4A_Ranked", "TotPop"],
    ["18", "097", "310103", "2", "3.666667", "7", "3", "5", "1", "931"],
    ["18", "097", "310201", "2", "9.333333", "17", "19", "9", "1", "2725"],
    ["18", "097", "320107", "1", "9", "4", "8", "8", "13", "595"],
    ["18", "097", "320107", "2", "13.333333", "16", "16", "11", "13", "1320"],
    ["18", "097", "330600", "1", "6", "5", "9", "10", "1", "751"],
    ["18", "097", "340110", "3", "14.5", "3", "8", "18", "20", "2626"],
    ["18", "097", "341700", "3", "11.833333", "17", "2", "8", "18", "425"],
    ["18", "097", "353500", "1", "15.666667", "12", "6", "18", "20", "1405"],
    ["18", "097", "356200", "1", "19.333333", "19", "19", "19", "20", "1144"],
    ["18", "097", "360301", "2", "9.666667", "11", "5", "8", "13", "822"],
    ["18", "097", "370302", "1", "3.333333", "2", "4", "6", "1", "3509"],
]
