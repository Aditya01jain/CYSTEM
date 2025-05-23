const {gemmeni, TTP_extractor} = require("../utils/gemini")


const keysToFind = [
    'optional_fields', 'content', 'threat_indicators', 'kill_chain_phase', 'tlp',
    'destruction_time', 'machine_card', 'internal_external', 'special_flag',
  ];
  
exports.process_data = (data) => {
console.log("Received alert data:");
const formattedData = getSelectedKeysString(keysToFind, data);
// parsed_data = gemmeni(formattedData);
attackTTPs = TTP_extractor(formattedData)
console.log(attackTTPs)
};

function getSelectedKeysString(keys, obj) {
return keys
    .filter(key => key in obj)
    .map(key => `${key}: ${obj[key]}`)
    .join(', ');
}

