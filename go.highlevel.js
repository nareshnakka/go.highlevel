import http from 'k6/http';
import { check, sleep } from 'k6';
import {
    baseConfig,
    authOptionsHeaders,
    loginHeaders,
    signInWithCustomTokenHeaders,
    lookupHeaders,
    createApiHeaders
} from './commons.js';
import { SharedArray } from 'k6/data';

// Initialize SharedArrays in the init context
const loginCsvData = new SharedArray('loginData', function () {
    return open('./loginData.csv').split('\n').map(line => {
        const [email, password] = line.split(',');
        return { email, password };
    });
});

const contactsCsvData = new SharedArray('contacts', function () {
    return open('./contacts.csv').split('\n').map(line => {
        const [firstName, lastName, email] = line.split(',');
        return { firstName, lastName, email };
    });
});

let authToken = null;
let userId = null;
let token = null;
let companyId = null;
let refreshToken = null;
let traceId = null;
let defaultDashboardId = null;
let contactId;
let locationId;

let idToken = null;

// Home page request
export function homePage() {
    const url = 'https://app.gohighlevel.com/';
    const res = http.get(url, baseConfig);
    check(res, {
        'homePage status is 200': (r) => r.status === 200,
    });
}

// Login page request
export function loginPage() {
    // OPTIONS request
    const authUrl = 'https://backend.leadconnectorhq.com/oauth/2/login/email';
    const authRes = http.options(authUrl, null, { headers: authOptionsHeaders });
    check(authRes, {
        'Auth OPTIONS request status is 200': (r) => r.status === 204,
    });


    // Get unique data for each iteration from the pre-initialized SharedArray
    const loginData = loginCsvData[__ITER % loginCsvData.length];

    const payload = JSON.stringify({
        domain: 'app.gohighlevel.com',
        subdomain: 'app',
        email: loginData.email,
        password: loginData.password,
        deviceId: 'f429b162-9fd5-460f-b619-f0b5f330e1a6',
        deviceType: 'web',
        deviceName: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
    });


    const loginRes = http.post(authUrl, { headers: loginHeaders }, payload);
    check(loginRes, {
        'Login POST request status is 200': (r) => r.status === 201,
    });

    console.log('Login Response : ' + payload);
    if (loginRes.json('authToken')) {
        authToken = loginRes.json('authToken');
        userId = loginRes.json('userId');
        token = loginRes.json('token');
        companyId = loginRes.json('companyId');
        refreshToken = loginRes.json('refreshToken');
        traceId = loginRes.json('traceId');
    }

    // signInWithCustomToken request
    const signInWithCustomTokenUrl = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=AIzaSyB_w3vXmsI7WeQtrIOkjR6xTRVN5uOieiE';
    const signInWithCustomTokenPayload = { "token": `${token}`, "returnSecureToken": true }

    const signInWithCustomTokenRes = http.post(signInWithCustomTokenUrl, JSON.stringify(signInWithCustomTokenPayload), { headers: signInWithCustomTokenHeaders });
    check(signInWithCustomTokenRes, {
        'Firebase signInWithCustomToken request status is 200': (r) => r.status === 200,
    });
    if (signInWithCustomTokenRes.json('idToken')) {
        idToken = signInWithCustomTokenRes.json('idToken');
        refreshToken = signInWithCustomTokenRes.json('refreshToken');
    }
}

// Dashboard page request
export function dashboardPage() {
    let response = http.post("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyB_w3vXmsI7WeQtrIOkjR6xTRVN5uOieiE",
        JSON.stringify({ "idToken": `${idToken}` }),
        { headers: lookupHeaders() }
    );

    check(response, {
        'lookupResponse status is 200': (r) => r.status === 200,
    });

    response = http.get(`https://backend.leadconnectorhq.com/users/${userId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'userResponse status is 200': (r) => r.status === 200,
    });
    if (response.json('roles')) {
        locationId = response.json().roles.locationIds[0];
    }

    console.log('userResponse : ' + response.status);
    console.log('locationId : ' + locationId);

    response = http.get(`https://backend.leadconnectorhq.com/integrations/custom-script/${companyId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'custom-Script status is 200': (r) => r.status === 200,
    });
    console.log('custom-Script : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/calendars/configuration/location/${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'location status is 200': (r) => r.status === 200,
    });
    console.log('location : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/locations/${locationId}/customFields/search?parentId=&skip=0&limit=10000&documentType=folder&model=all&query=&includeStandards=true`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'customFields search status is 200': (r) => r.status === 200,
    });
    console.log('customFields search : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/locations/${locationId}/labs/featureFlags/`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'featureFlags status is 200': (r) => r.status === 200,
    });
    console.log('featureFlags : ' + response.status);

    response = http.get(`https://services.leadconnectorhq.com/ai-wrapper/plan/company?companyId=${companyId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'AI Wrapper Plan status is 200': (r) => r.status === 200,
    });
    console.log('AI Wrapper Plan : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/scoring/profile?locationId=${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'scoring profile status is 200': (r) => r.status === 200,
    });
    console.log('scoring profile : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/ad-publishing/reselling/subscription/company/${companyId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'ad-publishing subscription status is 200': (r) => r.status === 200,
    });
    console.log('ad-publishing subscription : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/users/?locationId=${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'users by locationId status is 200': (r) => r.status === 200,
    });
    console.log('users by locationId : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/reselling/configuration/location/${locationId}/CP_BRANDED_APP_49`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'reselling configuration status is 200': (r) => r.status === 200,
    });
    console.log('reselling configuration : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/reselling/configuration/location/${locationId}/CP_BRANDED_APP_49`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'reselling configuration (specific location) status is 200': (r) => r.status === 200,
    });
    console.log('reselling configuration (specific location) : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/objects/?locationId=${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'objects by locationId status is 200': (r) => r.status === 200,
    });
    console.log('objects by locationId : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/payments/integrations/stripe/?location_id=${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'Stripe integration status is 200': (r) => r.status === 200,
    });
    console.log('Stripe integration : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/saas-billing-v2/billing-config/LOCATION/${locationId}/conversationAI?optIn=true`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'conversationAI billing-config status is 200': (r) => r.status === 200,
    });
    console.log('conversationAI billing-config : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/ad-publishing/reselling/subscription/location/${locationId}?productCode=Ad_Publishing_Standard_Plan`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'ad-publishing subscription (specific location) status is 200': (r) => r.status === 200,
    });
    console.log('ad-publishing subscription (specific location) : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/locations/${locationId}/customFields/search?parentId=&skip=0&limit=10000&documentType=field&model=all&query=&includeStandards=true`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'customFields search (documentType=field) status is 200': (r) => r.status === 200,
    });
    console.log('customFields search (documentType=field) : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/ad-publishing/reselling/configuration/location/${locationId}?productCode=Ad_Publishing_Connect_Your_BM_Location`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'ad-publishing configuration (specific productCode) status is 200': (r) => r.status === 200,
    });
    console.log('ad-publishing configuration (specific productCode) : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/locations/${locationId}/labs/featureFlags/`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'featureFlags (specific location) status is 200': (r) => r.status === 200,
    });
    console.log('featureFlags (specific location) : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/payments/integrations/stripe/?location_id=${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'Stripe integration (specific location) status is 200': (r) => r.status === 200,
    });
    console.log('Stripe integration (specific location) : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/membership/smart-list/offers-products/${locationId}`, {
        headers: createApiHeaders("", idToken)
    });
    check(response, {
        'membership smart-list offers-products status is 200': (r) => r.status === 200,
    });
    console.log('membership smart-list offers-products : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/objects/?locationId=${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'objects by locationId (specific location) status is 200': (r) => r.status === 200,
    });
    console.log('objects by locationId (specific location) : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/saas-billing-v2/billing-config/COMPANY/${companyId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'saas-billing-v2 billing-config status is 200': (r) => r.status === 200,
    });
    console.log('saas-billing-v2 billing-config : ' + response.status);

    response = http.get(`https://services.leadconnectorhq.com/ai-wrapper/plan/company?companyId=${companyId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'AI Wrapper Plan (specific company) status is 200': (r) => r.status === 200,
    });
    console.log('AI Wrapper Plan (specific company) : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/locations/${locationId}/meta-content`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'meta-content status is 200': (r) => r.status === 200,
    });
    console.log('meta-content : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/internal-tools/billing/implementation-modal-count?userId=${userId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'implementation-modal-count status is 200': (r) => r.status === 200,
    });
    console.log('implementation-modal-count : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/reporting/notification?notificationStatus=not_viewed&locationId=${locationId}&companyId=${companyId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'notification status is 200': (r) => r.status === 200,
    });
    console.log('notification : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/locations/${locationId}/customValues/`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'customValues status is 200': (r) => r.status === 200,
    });
    console.log('customValues : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/oauth/sidenav-custom-pages?companyId=${companyId}&locationId=${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'sidenav-custom-pages status is 200': (r) => r.status === 200,
    });
    console.log('sidenav-custom-pages : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/saas_service/saas-config/dI4MqoVoBuhdIw2srSn5/sync-location-saas-products`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'sync-location-saas-products status is 200': (r) => r.status === 200,
    });
    console.log('sync-location-saas-products : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/notifications/users/${userId}?limit=25&skip=0&deleted=false`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'notifications status is 200': (r) => r.status === 200,
    });
    console.log('notifications : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/phone-system/whatsapp/location/${locationId}/reselling/subscription`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'WhatsApp reselling subscription status is 200': (r) => r.status === 200,
    });
    console.log('WhatsApp reselling subscription : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/phone-system/whatsapp/location/${locationId}/reselling/subscription`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'WhatsApp reselling subscription (specific location) status is 200': (r) => r.status === 200,
    });
    console.log('WhatsApp reselling subscription (specific location) : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/users/?locationId=${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'users by specific locationId status is 200': (r) => r.status === 200,
    });
    console.log('users by specific locationId : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/locations/${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'specific location details status is 200': (r) => r.status === 200,
    });
    console.log('specific location details : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/reporting/notification/revex/whatsapp/whatsapp-banners?bannerType=INTEGRATE_WHATSAPP&locationId=${locationId}&userId=${userId}&companyId=${companyId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'WhatsApp banners status is 200': (r) => r.status === 200,
    });
    console.log('WhatsApp banners : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/reporting/notification/revex/lc-phone/incoming-call-status?locationId=${locationId}&userId=${userId}&companyId=${companyId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'incoming-call-status status is 200': (r) => r.status === 200,
    });
    console.log('incoming-call-status : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/reporting/notification/crm/integration/google-integration-status?locationId=${locationId}&userId=${userId}&companyId=${companyId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'Google integration status is 200': (r) => r.status === 200,
    });
    console.log('Google integration status : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/reporting/notification/automation/workflows/unpublished?locationId=${locationId}&userId=${userId}&companyId=${companyId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'unpublished workflows status is 200': (r) => r.status === 200,
    });
    console.log('unpublished workflows : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/reporting/notification/automation/calendar/integration-status?calendarType=linked&locationId=${locationId}&userId=${locationId}&companyId=${companyId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'calendar integration status is 200': (r) => r.status === 200,
    });
    console.log('calendar integration status : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/reporting/notification/revex/email-isv/email-blocked-status?locationId=${locationId}&userId=${userId}&companyId=${companyId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'email-blocked-status status is 200': (r) => r.status === 200,
    });
    console.log('email-blocked-status : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/reporting/notification/revex/yext/setup?locationId=${locationId}&userId=${userId}&companyId=${companyId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'Yext setup status is 200': (r) => r.status === 200,
    });
    console.log('Yext setup : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/custom-menus/?companyId=${companyId}&locationId=${locationId}&skip=0&limit=100`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'custom-menus status is 200': (r) => r.status === 200,
    });
    console.log('custom-menus : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/reporting/notification/revex/email-isv/sms-blocked-status?locationId=${locationId}&userId=${userId}&companyId=${companyId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'sms-blocked-status status is 200': (r) => r.status === 200,
    });
    console.log('sms-blocked-status : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/companies/${companyId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'company details status is 200': (r) => r.status === 200,
    });
    console.log('company details : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/reporting/dashboards?locationId=${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'dashboards status is 200': (r) => r.status === 200,
    });
    if (response.json('defaultDashboardId')) {
        defaultDashboardId = response.json('defaultDashboardId');
    }

    response = http.get(`https://backend.leadconnectorhq.com/phone-system/numbers/location/${locationId}/dialer?pageSize=10&page=0`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'phone-system numbers dialer status is 200': (r) => r.status === 200,
    });
    console.log('phone-system numbers dialer : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/phone-system/voice-call/location/${locationId}/recents`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'voice-call recents status is 200': (r) => r.status === 200,
    });
    console.log('voice-call recents : ' + response.status);

    response = http.post(
        'https://backend.leadconnectorhq.com/contacts/search/2',
        JSON.stringify({
            filters: [],
            locationId: `${locationId}`,
            page: 1,
            pageLimit: 20,
            sort: []
        }),
        {
            headers: {
                channel: 'APP',
                'content-type': 'application/json',
                origin: 'https://app.gohighlevel.com',
                source: 'WEB_USER',
                'token-id': `${idToken}`,
                version: '2021-04-15'
            }
        }
    );
    check(response, {
        'contacts search status is 200': (r) => r.status === 200,
    });
    console.log('contacts search : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/saas-billing-v2/billing-config/COMPANY/${companyId}/conversationAI`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'conversationAI billing-config (specific company) status is 200': (r) => r.status === 200,
    });
    console.log('conversationAI billing-config (specific company) : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/reselling/configuration/location/${locationId}/Prospecting`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'Prospecting configuration status is 200': (r) => r.status === 200,
    });
    console.log('Prospecting configuration : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/reporting/dashboards?locationId=${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'specific dashboards status is 200': (r) => r.status === 200,
    });
    console.log('specific dashboards : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/wordpress/payments/location/${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'WordPress payments location status is 200': (r) => r.status === 200,
    });
    console.log('WordPress payments location : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/reporting/dashboards/widgets-definitions?locationId=${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'widgets-definitions status is 200': (r) => r.status === 200,
    });
    console.log('widgets-definitions : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/opportunities/pipelines/?locationId=${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'opportunities pipelines status is 200': (r) => r.status === 200,
    });
    console.log('opportunities pipelines : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/reporting/dashboards/custom?locationId=${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'custom dashboards status is 200': (r) => r.status === 200,
    });
    console.log('custom dashboards : ' + response.status);

    response = http.get(`https://backend.leadconnectorhq.com/reporting/dashboards/${defaultDashboardId}/user/quick-filters?locationId=${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'quick-filters status is 200': (r) => r.status === 200,
    });
    console.log('quick-filters : ' + response.status);

    response = http.post(
        `https://backend.leadconnectorhq.com/locations/${locationId}/tasks/search`,
        JSON.stringify({
            limit: 10,
            skip: 0,
            assignedTo: [`${userId}`],
            completed: false,
            sortKey: "dueDate",
            sortDirection: 1,
            count: true
        }),
        {
            headers: createApiHeaders(authToken, idToken)
        }
    );
    check(response, {
        'tasks search status is 200': (r) => r.status === 200,
    });
    console.log('tasks search : ' + response.status);

}

export function contactsPage() {
    const response = http.get(`https://backend.leadconnectorhq.com/saas-api/location-metadata/${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(response, {
        'location-metadata status is 200': (r) => r.status === 200,
    });
    console.log('location-metadata : ' + response.status);

    const contactsResponse = http.get(`https://backend.leadconnectorhq.com/contacts/?locationId=${locationId}`, {
        headers: createApiHeaders(authToken, idToken)
    });
    check(contactsResponse, {
        'contacts status is 200': (r) => r.status === 200,
    });
    console.log('contacts : ' + contactsResponse.status);

    response = http.post(
        'https://backend.leadconnectorhq.com/contacts/search/2',
        JSON.stringify({
            filters: [],
            locationId: `${locationId}`,
            page: 1,
            pageLimit: 20,
            sort: []
        }),
        {
            headers: {
                channel: 'APP',
                'content-type': 'application/json',
                origin: 'https://app.gohighlevel.com',
                source: 'WEB_USER',
                'token-id': `${idToken}`,
                version: '2021-04-15'
            }
        }
    );
    check(response, {
        'contacts search status is 200': (r) => r.status === 200,
    });
    console.log('contacts search : ' + response.status);
}

export function createContact() {
    const url = 'https://backend.leadconnectorhq.com/contacts/?version=14-05-22';

    // Get unique data for each iteration from the pre-initialized SharedArray
    const contact = contactsCsvData[__ITER % contactsCsvData.length];

    const payload = JSON.stringify({
        tags: [],
        customFields: [],
        type: "lead",
        locationId: `${locationId}`,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        bounceEmail: false,
        unsubscribeEmail: false,
        timezone: null,
        dnd: false,
        additionalEmails: [],
        additionalPhones: [],
        internalSource: {
            type: "manual_addition",
            id: "KBJw7x1uRsnk8CaPIC3c",
            userName: "Naresh n"
        },
        attributionSource: {
            sessionSource: "CRM UI",
            medium: "manual",
            mediumId: null
        },
        dirty: true,
        skipTrigger: false,
        validateEmail: false
    });

    const response = http.post(url, payload, {
        headers: createApiHeaders(authToken, idToken)
    });

    if (response.json('id')) {
        const responseData = response.json();
        contactId = responseData.contact ? responseData.contact.id : null;
        console.log('Created Contact ID: ' + contactId);
    }

    check(response, {
        'createContact status is 200': (r) => r.status === 200,
    })

    console.log('createContact : ' + response.status);

}

export function updateContact() {
    const url = `https://backend.leadconnectorhq.com/contacts/${contactId}?version=14-05-22`;

    // Generate a unique phone number
    const uniquePhone = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const payload = JSON.stringify({
        phone: uniquePhone,
        customFields: [],
        dirty: true,
        skipTrigger: false
    });

    const response = http.post(url, payload, {
        headers: createApiHeaders(authToken, idToken)
    });

    check(response, {
        'updateContact status is 200': (r) => r.status === 200,
    });

    console.log('updateContact : ' + response.status);
    console.log('Updated Phone : ' + uniquePhone);
}

export function deleteContact() {

}
export function bulkDeleteRequest() {
    const url = 'https://services.leadconnectorhq.com/bulk-actions/request';
    const currentTime = new Date().toISOString().replace(/[-:.]/g, '_');
    const payload = JSON.stringify({
        bulkActionType: "bulk-delete-v2",
        title: `Bulk_Delete_${currentTime}`,
        scheduleType: "NOW",
        locationId: locationId,
        opSpecs: {
            opType: "bulk-delete-v2"
        },
        documentSource: "search",
        documentIds: ["" + contactId + ""]
    });

    const response = http.post(url, payload, {
        headers: createApiHeaders(authToken, idToken)
    });

    check(response, {
        'bulkDeleteRequest status is 200': (r) => r.status === 200,
    });

    console.log('bulkDeleteRequest : ' + response.status);
}
// Main test scenario
function randomSleep(min = 1, max = 3) {
    sleep(Math.random() * (max - min) + min);
}

export default function () {
    homePage();
    randomSleep();

    loginPage();
    randomSleep();

    dashboardPage();
    randomSleep();

    contactsPage();
    randomSleep();

    createContact();
    randomSleep();

    deleteContact();
}


/*export const options = {
    scenarios: {
        users: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '3m', target: 200 }, // Ramp-up to 200 users in 3 minutes
                { duration: '12m', target: 200 }, // Stay at 200 users for 12 minutes
            ],
            gracefulRampDown: '30s', // Graceful ramp-down period
        },
    },
    thresholds: {
        // Global thresholds
        http_req_failed: ['rate<0.02'],  // Error rate must be less than 2%
        http_req_duration: ['p(95)<800'], // 95% of requests must complete within 800ms

        // Specific endpoints thresholds
        'http_req_duration{url:https://backend.leadconnectorhq.com/campaigns}': ['p(95)<500'], // Campaigns API response time
        'http_req_duration{url:https://backend.leadconnectorhq.com/messages/send}': ['p(95)<500'], // Message send API response time

        // Response status checks
        'checks{name:homePage status is 200}': ['rate>0.98'],
        'checks{name:Login POST request status is 200}': ['rate>0.98'],
        'checks{name:contacts search status is 200}': ['rate>0.98'],
        'checks{name:createContact status is 200}': ['rate>0.98'],
        'checks{name:updateContact status is 200}': ['rate>0.98'],
        'checks{name:bulkDeleteRequest status is 200}': ['rate>0.98']
    }
};
*/

export const options = {
    vus: 1, // 1 virtual user
    iterations: 1, // 1 iteration
};