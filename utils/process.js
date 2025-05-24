const {gemmeni, TTP_extractor, sdo_finder, tld_file_genrator, summarize_alert, recommend_ques, create_playbook} = require("../utils/gemini")
const axios = require('axios');

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
    return {"tdl_files": tdl_files};
};

exports.generate_playbooks = async (data) =>{
    const formattedData = getSelectedKeysString(keysToFind, data);
    const formatted_ques = await recommend_ques(formattedData);

    return formatted_ques
}
exports.create_playbooks = async (data) =>{
    const formattedData = getSelectedKeysString(keysToFind, data);
    const formatted_ques = await create_playbook(formattedData);

    return formatted_ques
}


function getSelectedKeysString(keys, obj) {
return keys
    .filter(key => key in obj)
    .map(key => `${key}: ${obj[key]}`)
    .join(', ');
}

function getSelectedKeysString(keys, obj) {
    return keys
      .filter(key => key in obj)
      .map(key => `${key}: ${obj[key]}`)
      .join(', ');
  }
  
  // send post, then wait for pollData to return final response
  async function start_process_data(data) {
    // strip markdown fences if present
    const stripped = data.replace(/^```json\s*|```$/g, '');
  
    const postConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://r90guxvefb.execute-api.us-east-2.amazonaws.com/v1/detection-rules',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Content-Sha256': 'beaead3198f7da1e70d03ab969765e0821b24fc913697e929e726aeaebf0eba3',
        'X-Amz-Date': '20250524T033340Z',
        'Authorization': 'AWS4-HMAC-SHA256 Credential=AKIASLCANMO7LVIJ74HA/20250524/us-east-2/execute-api/aws4_request, SignedHeaders=content-length;content-type;host;x-amz-content-sha256;x-amz-date, Signature=2fb23c0c26c1a0c646acd85298ab76d5ad59f9465f2d5089e491974d4a62c516'
      },
      data: { security_content: stripped, user_rule_preference: 'splunk' }
    };
  
    // send initial request
    const response = await axios.request(postConfig);
    const messageId = response.data.messageId;
  
    // poll until terminal response
    return await pollData(messageId);
  }
  
  // polls until status !== 'PROCESSING'
  async function pollData(messageID) {
    const maxAttempts = 15;
    const delayMs = 30 * 1000; // 30 seconds
  
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { data } = await axios.get(
          'https://r90guxvefb.execute-api.us-east-2.amazonaws.com/v1/poll',
          {
            params: { messageId: messageID },
            headers: {
              'X-Amz-Date': '20250524T033733Z',
              'Authorization': 'AWS4-HMAC-SHA256 Credential=AKIASLCANMO7LVIJ74HA/20250524/us-east-2/execute-api/aws4_request, SignedHeaders=host;x-amz-date, Signature=7f986171f683433e06840d090befbb62ba79e6f8bdfc3e0c227897a3948ae0c9'
            },
            maxBodyLength: Infinity
          }
        );
  
        console.log(`Attempt ${attempt}:`, data);
  
        if (data.status !== 'PROCESSING') {
          console.log(`Final status: ${data.status} received.`);
          return data;
        }
  
        if (attempt < maxAttempts) {
          console.log('Still PROCESSING, retrying after delay...');
          await new Promise(res => setTimeout(res, delayMs));
        } else {
          throw new Error(`Exceeded ${maxAttempts} attempts without final status`);
        }
      } catch (err) {
        console.error(`Attempt ${attempt} error:`, err.message || err);
        if (attempt < maxAttempts) {
          console.log('Error occurred, retrying after delay...');
          await new Promise(res => setTimeout(res, delayMs));
        } else {
          throw err;
        }
      }
    }
  }
  