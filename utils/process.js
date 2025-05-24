const {gemmeni, TTP_extractor, sdo_finder, tld_file_genrator, summarize_alert} = require("../utils/gemini")


const keysToFind = [
    'optional_fields', 'content', 'threat_indicators', 'kill_chain_phase', 'tlp',
    'destruction_time', 'machine_card', 'internal_external', 'special_flag',
  ];


exports.summarize = async (data) => {
    console.log("Received alert data:");
    const formattedData = getSelectedKeysString(keysToFind, data);

    const parsed_bundle = await summarize_alert(formattedData);
    return {
        "data": parsed_bundle
    };
};

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
    console.log(tdl_files)
    return {
        "tdl_files": tdl_files
    };
} 

exports.generate_playbooks = async (data) => {
    const formattedData = getSelectedKeysString(keysToFind, data);
    data = co_gemeini(formattedData)
    console.log(data)
    return {
        'palybook': data
    }
}

function getSelectedKeysString(keys, obj) {
return keys
    .filter(key => key in obj)
    .map(key => `${key}: ${obj[key]}`)
    .join(', ');
}

