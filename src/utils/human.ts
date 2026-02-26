import { CookieStorage, LocalStore } from '@/utils/storages'

const tokenStore = new CookieStorage('human_page_token', '/', 365)

const langSettingStore = new LocalStore('human_page_lang')

const userInfoStore = new LocalStore('human_page_userInfo')

const themeStore = new LocalStore('human_page_theme')

export { tokenStore, langSettingStore, userInfoStore, themeStore }
