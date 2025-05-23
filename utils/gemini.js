import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyDEnhGVTy1UwAEM__YhGjkNRpCcUNl_gLM" });

export async function sdo_finder(content) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents:content,
    config: {
        systemInstruction: "You are an information extraction assistant specialized in cybersecurity threat intelligence. You will be given raw threat advisories in unstructured paragraph format as a string. Your task is to analyze the input text and extract all relevant Indicators of Compromise (IOCs) and STIX Domain Objects.\n\nYou must return a Python dictionary in the following format:\n\n{\n  \"ipv4\": {},\n  \"ipv6\": {},\n  \"domain\": {},\n  \"url\": {},\n  \"email\": {},\n  \"hash_md5\": {},\n  \"hash_sha1\": {},\n  \"hash_sha256\": {},\n  \"malware\": {},\n  \"attack_pattern\": {},\n  \"campaign\": {},\n  \"course_of_action\": {},\n  \"grouping\": {},\n  \"identity\": {},\n  \"indicator\": {},\n  \"infrastructure\": {},\n  \"intrusion_set\": {},\n  \"location\": {},\n  \"malware_analysis\": {},\n  \"note\": {},\n  \"observed_data\": {},\n  \"opinion\": {},\n  \"report\": {},\n  \"threat_actor\": {},\n  \"tool\": {},\n  \"vulnerability\": {}\n}\n\nGuidelines:\n- Extract all IOCs such as IPv4, IPv6, URLs, email addresses, and file hashes (MD5, SHA-1, SHA-256).\n- Extract all STIX Domain Objects mentioned, matching their names to the corresponding keys in the dictionary.\n- Each extracted item should be a key in the corresponding category dictionary, with a short description or sentence (if available) from the original text as its value.\n- If a field has no relevant data, leave it as an empty dictionary.\n- Ensure accuracy and avoid false positives—only extract information that is explicitly mentioned or clearly implied in the advisory.\n\nYour output should only include the final dictionary in valid Python format."

      },
  });
  return stix_bundle_generator(response.text);
}

export async function stix_bundle_generator(parsed_data){
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents:parsed_data,
        config: {
            systemInstruction: "You are a STIX 2.1 bundle generator. You will be provided with a Python dictionary containing IOCs and STIX Domain Objects, for example:\n\n{\n  \"ipv4\": {...},\n  \"ipv6\": {...},\n  \"domain\": {...},\n  \"url\": {...},\n  \"email\": {...},\n  \"hash_md5\": {...},\n  \"hash_sha1\": {...},\n  \"hash_sha256\": {...},\n  \"malware\": {...},\n  \"attack_pattern\": {...},\n  \"campaign\": {...},\n  \"course_of_action\": {...},\n  \"grouping\": {...},\n  \"identity\": {...},\n  \"indicator\": {...},\n  \"infrastructure\": {...},\n  \"intrusion_set\": {...},\n  \"location\": {...},\n  \"malware_analysis\": {...},\n  \"note\": {...},\n  \"observed_data\": {...},\n  \"opinion\": {...},\n  \"report\": {...},\n  \"threat_actor\": {...},\n  \"tool\": {...},\n  \"vulnerability\": {...}\n}\n\nA separate string field `title` contains the report name.\n\nYour task is to produce a **valid STIX 2.1 Bundle JSON object** with the following rules:\n\n---\n\n 1. Bundle Properties:\n- \"type\": \"bundle\"\n- \"spec_version\": \"2.1\"\n- \"id\" must be a UUID prefixed with \"bundle--\".\n\n---\n\n2. Create a STIX Report object:\n- \"type\": \"report\"\n- \"spec_version\": \"2.1\"\n- \"id\" must be a UUID prefixed with \"report--\".\n- \"name\" must be set to the `title`.\n- \"published\", \"created\", and \"modified\" must be valid RFC3339 timestamps (use the current UTC time in ISO 8601 format).\n- \"object_refs\" must list the IDs of all other created objects.\n- \"report_types\" must be a list, e.g., [\"threat-report\"].\n\n---\n\n3. For each item in the input dictionary:\n- Generate the corresponding STIX object with a proper \"type\" (e.g., \"ipv4-addr\", \"domain-name\", \"file\", \"malware\", etc.).\n- Assign a UUID-based \"id\" (e.g., \"malware--<UUID>\").\n- Each object **must** include:\n  - \"type\"\n  - \"spec_version\": \"2.1\"\n  - \"id\"\n  - \"created\" and \"modified\" timestamps (use the same value for both, current UTC).\n- Include required fields specific to the STIX object type. For example:\n  - malware must include \"name\" and \"is_family\" (boolean).\n  - tool must include \"name\".\n  - attack-pattern must include \"name\".\n  - vulnerability must include \"name\".\n- Populate content using the input dictionary data (e.g., use \"description\", \"value\", etc.).\n\n---\n\n 4. Constraints:\n- All generated objects must follow the STIX 2.1 schema strictly.\n- The reports \"object_refs\" must include **all other objects IDs and published as a field other than all**.\n- Do **not** include any extra fields not defined in the STIX 2.1 specification.\n\nReturn the final **valid STIX 2.1 JSON Bundle** only."
          },
      });
      return response.text
}

export async function TTP_extractor(data){
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents:data,
        config: {
            systemInstruction: "You are a cybersecurity information extraction assistant specialized in identifying TTPs (Tactics, Techniques, and Procedures) from threat intelligence reports. You will be given a raw threat advisory in unstructured paragraph format as a string.\n\nYour task is to analyze the input text and extract all relevant TTPs using the MITRE ATT&CK framework.\n\nYou must return a Python dictionary where:\n- Each key is a recognized MITRE ATT&CK Technique ID (e.g., 'T1059').\n- Each value is the corresponding MITRE ATT&CK Technique Name (e.g., 'Command and Scripting Interpreter').\n\nGuidelines:\n- Only include techniques that are explicitly mentioned or clearly implied in the advisory.\n- Do not include tactics (e.g., 'Execution', 'Persistence')—only techniques.\n- If sub-techniques are present (e.g., 'T1059.001'), use them as the key and include their exact name as the value.\n- Ensure output is a valid Python dictionary.\n- Leave the dictionary empty if no valid technique is found.\n\nYour output should be a single Python dictionary object in string format with '\\n' representing newlines."

          },
      });

      mitre_defend_extractor(response.text);
}

export async function mitre_defend_extractor(data){
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents:data,
        config: {
            systemInstruction: "You are a cybersecurity knowledge retrieval agent. Your task is to map one or more MITRE ATT&CK technique IDs to their related MITRE D3FEND (Defensive) techniques and return the result in JSON format.\n\nFor each MITRE ATT&CK ID provided:\n- Look up the related MITRE D3FEND techniques using the official D3FEND knowledge graph (via STIX-based mappings).\n- For each related D3FEND technique, retrieve the following fields:\n  - `defender_id`: The unique MITRE D3FEND identifier (e.g., \"D3-DA0001\").\n  - `title`: The official name of the D3FEND technique.\n  - `content`: A detailed description of what the technique does.\n  - `remedies`: A list of defensive actions or mitigation techniques associated with the D3FEND method. If no specific remedies are available, return an empty array.\n\nIf a MITRE ATT&CK ID has no related D3FEND techniques, return `null` for that ATT&CK ID.\n\nExpected Output Format (JSON):\n```json\n{\n  \"T1059\": [\n    {\n      \"defender_id\": \"D3-DA0001\",\n      \"title\": \"Process Activity Analysis\",\n      \"content\": \"Analyzes and monitors process behavior to detect anomalies or signs of compromise.\",\n      \"remedies\": [\n        \"Deploy endpoint detection and response (EDR) tools.\",\n        \"Monitor abnormal child processes or shell invocations.\"\n      ]\n    }\n  ],\n  \"TXXXX\": null\n}\n```\n\nAdditional Instructions:\n- Return only a clean JSON object with no extra commentary or metadata.\n- If multiple ATT&CK IDs are submitted, include them all in the root-level JSON object."

          },
      });
    return response.text
}


 