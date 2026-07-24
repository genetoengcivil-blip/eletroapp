export interface StoredAccount {
  email: string
  full_name: string
  role: string
  avatar_color: string
}

const STORAGE_KEY = 'eletroapp_accounts'
const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

function getAccounts(): StoredAccount[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
}

export function addAccount(email: string, full_name: string, role: string) {
  const accounts = getAccounts()
  const existing = accounts.findIndex(a => a.email === email)
  const color = COLORS[accounts.length % COLORS.length]
  const account: StoredAccount = { email, full_name, role, avatar_color: color }
  if (existing >= 0) {
    accounts[existing] = account
  } else {
    accounts.push(account)
  }
  saveAccounts(accounts)
  return accounts
}

export function removeAccount(email: string) {
  const accounts = getAccounts().filter(a => a.email !== email)
  saveAccounts(accounts)
  return accounts
}

export function getStoredAccounts() {
  return getAccounts()
}
