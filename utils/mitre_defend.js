import axios from 'axios';

const BASE_URL = 'https://next.d3fend.mitre.org/api';

async function getJson(url) {
  const response = await axios.get(url);
  return response.data;
}

export async function defend(attackTTPs) {
  const cleanedJsonString = attackTTPs.replace(/```json\s*|\s*```/g, '');
  const mitreTechniques = JSON.parse(cleanedJsonString);
  console.log(mitreTechniques);

  for (const attackId of Object.keys(mitreTechniques)) {
    console.log(`→ Looking up ATT&CK Technique ${attackId}: ${mitreTechniques[attackId]}`);

    try {
      const stixId = await getJson(`${BASE_URL}/offensive-technique/attack/${attackId}.json`).then(data => data.id);
      console.log(`  · STIX ID = ${stixId}`);

      const relations = await getJson(`${BASE_URL}/ontology/describe/inbound/${stixId}.json`).then(data => (data.inbound || []).filter(rel => rel.predicate === 'inference:related-to'));

      if (relations.length === 0) {
        console.log("  · No related D3FEND techniques found.\n");
        continue;
      }

      console.log(`  · Found ${relations.length} related D3FEND technique(s):`);

      for (const rel of relations) {
        const subj = rel.subject;
        const details = await getJson(`${BASE_URL}/technique/${subj}.json`).then(data => {
          const ext = (data.external_references || [{}])[0];
          return {
            d3fend_id: ext.external_id || 'Unknown',
            name: data.name || 'Unnamed Technique',
            tactic: data.kill_chain_phases || [],
            description: data.description || data.definition || ''
          };
        });

        console.log(`    • ${details.d3fend_id}: ${details.name}`);
        if (details.description) {
          const desc = details.description;
          console.log(`        ↳ ${desc.length > 200 ? desc.substring(0, 200) + '…' : desc}`);
        }
      }
      console.log();

    } catch (err) {
      console.error(`  ERROR: Failed to fetch data for ${attackId}`, err.message);
    }
  }
}
