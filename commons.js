// Base configuration for common headers
export const baseConfig = {
    headers: {
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    },
};

// Common headers for authentication OPTIONS request
export const authOptionsHeaders = {
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'access-control-request-headers': 'baggage,channel,content-type,sentry-trace,source,version',
    'access-control-request-method': 'POST',
    'cache-control': 'no-cache',
    'origin': 'https://app.gohighlevel.com',
    'pragma': 'no-cache',
    'priority': 'u=1, i',
    'referer': 'https://app.gohighlevel.com/',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
};

// Common headers for login POST request
export const loginHeaders = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
    'baggage': 'sentry-environment=production,sentry-release=cf95f91967d61ea4280aca86f1bd4e9ddc69954f,sentry-public_key=f1021b1c229264754b7df658ebea5bf3,sentry-trace_id=a8b6a9d671e14ec9853178351eb7e3b7,sentry-transaction=login,sentry-sampled=true,sentry-sample_rand=0.5915232730455262,sentry-sample_rate=1',
    'cache-control': 'no-cache',
    'channel': 'APP',
    'content-type': 'application/json',
    'origin': 'https://app.gohighlevel.com',
    'pragma': 'no-cache',
    'priority': 'u=1, i',
    'referer': 'https://app.gohighlevel.com/',
    'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    //'sentry-trace': 'a8b6a9d671e14ec9853178351eb7e3b7-907b97110f410f6c-1',
    'source': 'WEB_USER',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
};

// Common headers for Firebase signInWithCustomToken request
export const signInWithCustomTokenHeaders = {
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'cache-control': 'no-cache',
    'content-type': 'application/json',
};

// Function to create user headers with dynamic auth token
export const lookupHeaders = () => ({
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
});

// Function to create API headers with auth token and token-id
export const createApiHeaders = (authToken, idToken) => ({
    'accept': 'application/json, text/plain, */*',
    'Authorization': `Bearer ${authToken}`,
    'token-id': `${idToken}`,
    'version': '2021-07-28',
    'channel': 'APP',
    'source': 'WEB_USER'
});