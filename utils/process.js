const {gemmeni, TTP_extractor, mitre_defend_extractor} = require("../utils/gemini")


const keysToFind = [
    'optional_fields', 'content', 'threat_indicators', 'kill_chain_phase', 'tlp',
    'destruction_time', 'machine_card', 'internal_external', 'special_flag',
  ];
  
exports.process_data = async (data) => {
    console.log("Received alert data:");
    const formattedData = getSelectedKeysString(keysToFind, data);

    const parsed_bundle = await sdo_finder(formattedData);
    const attackTTPs = await TTP_extractor(formattedData);

    return {
        "stix 2.1 bundle": parsed_bundle,
        "mitre_defend": attackTTPs
    };
};


function getSelectedKeysString(keys, obj) {
return keys
    .filter(key => key in obj)
    .map(key => `${key}: ${obj[key]}`)
    .join(', ');
}

