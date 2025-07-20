import { Account } from "./popup/App";



export default defineBackground(() => {
  updateAccounts()

  // Function to set cookies
  async function setCookies(cookies: Record<string, string>) {
    await clearCookies()
    for (const [name, value] of Object.entries(cookies)) {
      try {
        await browser.cookies.set({
          url: 'https://www.twitch.tv',
          name: name,
          value: value,
          path: '/',
          sameSite: 'strict'
        });
        console.log(`Set cookie ${name}:`, value);
      } catch (err) {
        console.error(`Failed to set cookie ${name}:`, err);
      }
    }
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      await browser.tabs.reload(tab.id);
    }

  }

  // Function to clear cookies
  async function clearCookies() {
    try {
      const cookies = await browser.cookies.getAll({ domain: 'twitch.tv' });
      for (const cookie of cookies) {
        await browser.cookies.remove({
          url: 'https://www.twitch.tv',
          name: cookie.name
        });
      }
      console.log('All cookies cleared');
    } catch (err) {
      console.error('Failed to clear cookies:', err);
    }
  }

  async function addAccount() {
    clearCookies()
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      await browser.tabs.create({ url: 'https://www.twitch.tv/login' });
    }
  }
  async function updateAccounts() {
    const result = await browser.storage.local.get('accounts');
    const data = result.accounts || [];
    const cookies = await browser.cookies.getAll({ domain: 'twitch.tv' });

    // Get all required cookie values
    const login = cookies.find((cookie: any) => cookie.name === 'login')?.value;
    const name = cookies.find((cookie: any) => cookie.name === 'name')?.value;
    const authToken = cookies.find((cookie: any) => cookie.name === 'auth-token')?.value;
    const serverSessionId = cookies.find((cookie: any) => cookie.name === 'server_session_id')?.value;
    const apiToken = cookies.find((cookie: any) => cookie.name === 'api_token')?.value;
    const twilightUser = cookies.find((cookie: any) => cookie.name === 'twilight-user')?.value;
    const uniqueId = cookies.find((cookie: any) => cookie.name === 'unique_id')?.value;
    const last_login = cookies.find((cookie: any) => cookie.name === 'last_login')?.value;
    // Check if this account already exists
    const existingAccount = data.find((account: any) => account.name === name);

    // Only create new account if all required values are present and account doesn't exist
    if (!existingAccount && login && name && authToken && twilightUser && uniqueId && serverSessionId && apiToken && last_login) {
      const newAccount: Account = {
        login,
        name,
        'auth-token': authToken,
        'last_login': last_login,
        'twilight-user': twilightUser,
        unique_id: uniqueId,
        server_session_id: serverSessionId,
        api_token: apiToken
      }
      try {
        const currentAccounts = data;
        const updatedAccounts = [...currentAccounts, newAccount];

        await browser.storage.local.set({ accounts: updatedAccounts });
        console.log(`Added ${newAccount.name} to accounts`);
      } catch (error) {
        console.error('Failed to save account to storage:', error);
      }
    }
  }

  browser.cookies.onChanged.addListener(async (changeInfo) => {
    updateAccounts()
  });


  // Listen for messages from content scripts
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'setCookies') {
      console.log('Setting cookies:', message.cookies);
      setCookies(message.cookies).then(() => sendResponse({ success: true }));
      return true; // Keep the message channel open for async response
    }
    if (message.action === 'getAccounts') {

      return true;
    }
    if (message.action === 'addAccount') {
      addAccount()
      return true;
    }

  });

  async function updateAuthHeader(token: string) {
    console.log('Updating auth header:', token);
    // Remove existing rule if any
    await browser.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1]
    });

    // Add new rule for Authorization header
    await browser.declarativeNetRequest.updateDynamicRules({
      addRules: [{
        id: 1,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [{
            header: "Authorization",
            operation: "set",
            value: `OAuth ${token}`
          }]
        },
        condition: {
          urlFilter: "*://*.twitch.tv/*",
          resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest"]
        }
      }]
    });

  }

  // Listen for messages to update the auth header
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'OAuth') {
      updateAuthHeader(message.token);
      sendResponse({ success: true });
    }
  });
});
