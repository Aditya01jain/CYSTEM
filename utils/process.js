const {gemmeni, TTP_extractor, sdo_finder, tld_file_genrator} = require("../utils/gemini")


const keysToFind = [
    'optional_fields', 'content', 'threat_indicators', 'kill_chain_phase', 'tlp',
    'destruction_time', 'machine_card', 'internal_external', 'special_flag',
  ];
  
exports.get_bundle = async (data) => {
    console.log("Received alert data:");
    const formattedData = getSelectedKeysString(keysToFind, data);

    const parsed_bundle = await sdo_finder(formattedData);
    return {
        "bundle": parsed_bundle
    };
};

exports.defender_extract = async (data) => {
    console.log("Received alert data:");
    const formattedData = getSelectedKeysString(keysToFind, data);
    const attackTTPs = await TTP_extractor(formattedData);
    return {
        "mitre_defend": attackTTPs
    };
};

exports.tld_file_extracter = async (data) => {
    const formattedData = getSelectedKeysString(keysToFind, data);

    const tdl_files = await tld_file_genrator(formattedData);
    return {
        "tdl_files": tdl_files
    };
} 

function getSelectedKeysString(keys, obj) {
return keys
    .filter(key => key in obj)
    .map(key => `${key}: ${obj[key]}`)
    .join(', ');
}

