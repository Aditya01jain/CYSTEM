import axios from 'axios';

self.onmessage = async function (e: any) {
	try {
		const { url, token, ioctypes, payload } = e.data;
		const $req = axios.create({
			baseURL: url,
			allowAbsoluteUrls: true,
			headers: {
				'Cache-Control': 'no-cache',
				'If-Modified-Since': '0',
				Authorization: token
			}
		});
		const promises = ioctypes.map((type: string) => {
			return $req.post(`${type}/`, {
				threat_indicators: payload
			});
		});

    const res = await Promise.allSettled(promises);
    const modifiedData = res
      .filter((result: any) => result.status === 'fulfilled' && result.value?.data)
      .map((result: any) => result.value.data);
    self.postMessage(modifiedData);// Send data back to main thread
  } catch (error: any) {
    self.postMessage({ error: error.message });
  }
};
