import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: "AIzaSyDEnhGVTy1UwAEM__YhGjkNRpCcUNl_gLM" });

export async function summarize_alert(content) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents:content,
    config: {
        systemInstruction: "You are a threat intelligence analysis assistant. When given a text report or raw analysis output, you must:\n1. Read the entire input carefully.\n2. Produce a concise “summary” of the input in one or two sentences.\n3. Identify and extract every TTP (Tactics, Techniques, Procedures) mentioned.\n4. Identify and extract every Indicator (e.g., file hashes, IP addresses, domains, URLs, mutexes).\n5. Identify and extract any other STIX Domain Objects (SDOs) such as Malware, Tools, Infrastructure, Identity, etc.\n6. Organize your findings into a JSON object with the following structure:\n{\n  \"summary\": \"<concise summary>\",\n  \"ttps\": [\n    {\n      \"id\": \"<unique identifier if present or generated>\",\n      \"name\": \"<TTP name>\",\n      \"description\": \"<short description if available>\"\n    }\n    ...\n  ],\n  \"indicators\": [\n    {\n      \"id\": \"<indicator ID if present or generated>\",\n      \"type\": \"<file-hash|ip|domain|url|email|mutex|...>\",\n      \"value\": \"<the indicator value>\"\n    }\n    ...\n  ],\n  \"sdos\": [\n    {\n      \"type\": \"<Malware|Tool|Infrastructure|Identity|Campaign|...>\",\n      \"id\": \"<SDO ID if present or generated>\",\n      \"properties\": {\n        \"...\": \"...\"\n      }\n    }\n    ...\n  ]\n}\n7. Return only the JSON object, without any additional explanation or commentary."
      },
  });
  return response.text;
}
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
  console.log(parsed_data)
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents:parsed_data,
        config: {
            systemInstruction: "You are a STIX 2.1 bundle generator and you have to return the whole bundle don't return the half bundle. You will be provided with a Python dictionary containing IOCs and STIX Domain Objects, for example:\n\n{\n  \"ipv4\": {...},\n  \"ipv6\": {...},\n  \"domain\": {...},\n  \"url\": {...},\n  \"email\": {...},\n  \"hash_md5\": {...},\n  \"hash_sha1\": {...},\n  \"hash_sha256\": {...},\n  \"malware\": {...},\n  \"attack_pattern\": {...},\n  \"campaign\": {...},\n  \"course_of_action\": {...},\n  \"grouping\": {...},\n  \"identity\": {...},\n  \"indicator\": {...},\n  \"infrastructure\": {...},\n  \"intrusion_set\": {...},\n  \"location\": {...},\n  \"malware_analysis\": {...},\n  \"note\": {...},\n  \"observed_data\": {...},\n  \"opinion\": {...},\n  \"report\": {...},\n  \"threat_actor\": {...},\n  \"tool\": {...},\n  \"vulnerability\": {...}\n}\n\nA separate string field `title` contains the report name.\n\nYour task is to produce a **valid STIX 2.1 Bundle JSON object** with the following rules:\n\n---\n\n 1. Bundle Properties:\n- \"type\": \"bundle\"\n- \"spec_version\": \"2.1\"\n- \"id\" must be a UUID prefixed with \"bundle--\".\n\n---\n\n2. Create a STIX Report object:\n- \"type\": \"report\"\n- \"spec_version\": \"2.1\"\n- \"id\" must be a UUID prefixed with \"report--\".\n- \"name\" must be set to the `title`.\n- \"published\", \"created\", and \"modified\" must be valid RFC3339 timestamps (use the current UTC time in ISO 8601 format).\n- \"object_refs\" must list the IDs of all other created objects.\n- \"report_types\" must be a list, e.g., [\"threat-report\"].\n\n---\n\n3. For each item in the input dictionary:\n- Generate the corresponding STIX object with a proper \"type\" (e.g., \"ipv4-addr\", \"domain-name\", \"file\", \"malware\", etc.).\n- Assign a UUID-based \"id\" (e.g., \"malware--<UUID>\").\n- Each object **must** include:\n  - \"type\"\n  - \"spec_version\": \"2.1\"\n  - \"id\"\n  - \"created\" and \"modified\" timestamps (use the same value for both, current UTC).\n- Include required fields specific to the STIX object type. For example:\n  - malware must include \"name\" and \"is_family\" (boolean).\n  - tool must include \"name\".\n  - attack-pattern must include \"name\".\n  - vulnerability must include \"name\".\n- Populate content using the input dictionary data (e.g., use \"description\", \"value\", etc.).\n\n---\n\n 4. Constraints:\n- All generated objects must follow the STIX 2.1 schema strictly.\n- The reports \"object_refs\" must include **all other objects IDs and published as a field other than all**.\n- Do **not** include any extra fields not defined in the STIX 2.1 specification.\n\nReturn the final **valid STIX 2.1 JSON Bundle** only. if there is no ioc dont generate the bundle return null.MUST STEP SEND THE WHOLE BUNDLE , there may be a case when u are able to send the half bundle so please send the valid bundle dont send the half bundle"
          },
      });
      console.log(response.text)
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

      return mitre_defend_extractor(response.text);
}

export async function mitre_defend_extractor(data){
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents:data,
        config: {
            systemInstruction: "You are a cybersecurity knowledge retrieval agent. Your task is to map one or more MITRE ATT&CK technique IDs to their related MITRE D3FEND (Defensive) techniques and return the result in JSON format.\n\nFor each MITRE ATT&CK ID provided:\n- Look up the related MITRE D3FEND techniques using the official D3FEND knowledge graph (via STIX-based mappings).\n- For each related D3FEND technique, retrieve the following fields:\n  - `defender_id`: The unique MITRE D3FEND identifier (e.g., \"D3-DA0001\").\n  - `title`: The official name of the D3FEND technique.\n  - `content`: A detailed description of what the technique does.\n  - `remedies`: A list of defensive actions or mitigation techniques associated with the D3FEND method. If no specific remedies are available, return an empty array.\n\nIf a MITRE ATT&CK ID has no related D3FEND techniques, return `null` for that ATT&CK ID.\n\nExpected Output Format (JSON):\n```json\n{\n  \"T1059\": [\n    {\n      \"defender_id\": \"D3-DA0001\",\n      \"title\": \"Process Activity Analysis\",\n      \"content\": \"Analyzes and monitors process behavior to detect anomalies or signs of compromise.\",\n      \"remedies\": [\n        \"Deploy endpoint detection and response (EDR) tools.\",\n        \"Monitor abnormal child processes or shell invocations.\"\n      ]\n    }\n  ],\n  \"TXXXX\": null\n}\n```\n\nAdditional Instructions:\n- Return only a clean JSON object with no extra commentary or metadata.\n add the remedies for the finded defender_id- If multiple ATT&CK IDs are submitted, include them all in the root-level JSON object."

          },
      });
    return response.text
}

export async function tld_file_genrator(data){
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents:data,
        config: {
            systemInstruction: "You are a specialized rule-generation assistant for cybersecurity alert data. Your job is to consume a single JSON-formatted “alert” object and, if—and only if—you can craft a valid detection or response rule for it, emit exactly one JSON object in the following schema; otherwise emit nothing (no output at all).\n\n**When you do emit a rule, obey these requirements:**\n\n1. **Determine the appropriate content type** from the list below, based on the nature of the alert and the rule you re writing:\n   - **Analytics CAR** (`.yaml` / `.yml`)\n   - **Response Playbook** (`.json`)\n   - **SIEM Rule - Sigma** (`.yaml` / `.yml`)\n   - **Threat Detection  Snort/Suricata** (`.rules`)\n   - **SIEM Rule Splunk** (`.spl`)\n\n2. **Output format**  \n   Return a single JSON object whose top-level key is the chosen **type** (one of the five above), whose value is an object with exactly two fields:\n   - `description`: a brief, human-readable summary of what this rule does.\n   - `rule_code`: a string containing the complete rule/playbook in its native syntax (with proper indentation and file-extension conventions).\n\n```json\n{\n  \"<Type>\": {\n    \"description\": \"<one-sentence summary>\",\n    \"rule_code\": \"<complete rule text>\"\n  }\n}\n```\n\n3. **No extra keys or metadata.** Do not wrap this in arrays or return any explanatory text. If you cannot produce a valid rule, return nothing.\n\n---\n\n**Example input (you will be given this):**\n\n```json\n{\n  \"alert_id\": \"ALRT-2025-001\",\n  \"event\": \"multiple failed SSH logins\",\n  \"source_ip\": \"203.0.113.45\",\n  \"timestamp\": \"2025-05-23T08:15:00Z\",\n  \"severity\": \"medium\"\n}\n```\n\n**Example valid output** (Sigma rule):\n\n```json\n{\n  \"SIEM Rule - Sigma\": {\n    \"description\": \"Detects multiple failed SSH login attempts from the same source IP within 5 minutes\",\n    \"rule_code\": \"title: Multiple SSH Failures\\nid: b1e0f7a2-c3d4-11ec-8fea-0242ac120002\\ndetection:\\n  selection:\\n    EventID: 4625\\n    LogonType: 3\\n    ProcessName: '*\\\\\\\\sshd.exe'\\n  timeframe: 5m\\n  condition: selection | count() by SourceIp > 5\\nlevel: medium\"\n  }\n}\n```\n\n> Remember: if no rule can be created for the given alert, produce absolutely no output"
          },
      });
    return response.text
}
