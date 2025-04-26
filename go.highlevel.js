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

export const options = {
    vus: 1,
    iterations: 1,
};

let authToken = null;
let userId = null;
let token = null;
let companyId = null;
let refreshToken = null;
let traceId = null;
let defaultDashboardId = null;

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
    console.log('Auth OPTIONS : ' + authRes.status);

    // Login POST request
    const payload = JSON.stringify({
        domain: 'app.gohighlevel.com',
        subdomain: 'app',
        email: 'nareshnakka@outlook.com',
        password: 'Naresh@GHL1',
        deviceId: 'e63484fe-e2c4-4ee4-a250-c243eb87fb66',
        deviceType: 'web',
        deviceName: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
    });

    const loginRes = http.post(authUrl, payload, { headers: loginHeaders });
    check(loginRes, {
        'Login POST request status is 200': (r) => r.status === 201,
    });
    console.log('Login Response : ' + loginRes.status);
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
    let locationId = null;
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

// Main test scenario
export default function () {
    homePage();
    sleep(1);

    loginPage();
    sleep(1);

    dashboardPage();
    sleep(2);
}