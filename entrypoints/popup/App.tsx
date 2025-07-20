import { useEffect, useState } from 'react';

import './App.css';

export interface Account {
  name: string;
  login: string;
  api_token: string;
  'auth-token': string;
  'last_login': string;
  'twilight-user': string;
  unique_id: string;
  server_session_id: string;
}

function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAccounts = () => {
      try {
        browser.storage.local.get('accounts', (data) => {
          setAccounts(data?.accounts || []);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load accounts');
        console.error('Error loading accounts:', err);
      }
    };
    loadAccounts();
  }, []);

  return (
    <>
      <div className='accounts'>
        {error ? (
          <div className="error">{error}</div>
        ) : (
          <ul>
            {accounts.map((account) => (
              <li className='account' key={account.login} onClick={() => {
                browser.runtime.sendMessage({ action: 'setCookies', cookies: account });
              }}>
                <div>{account.name}</div>
              </li>
            ))}
          </ul>
        )}
        <ul>
          <li className='account' onClick={() => {
            browser.runtime.sendMessage({ action: 'addAccount' });
          }}>
            <div>Add Account</div>
          </li>
        </ul>
      </div>
    </>
  );
}

export default App;