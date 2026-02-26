import Vue from 'vue'
import Vuex from 'vuex'
import { tokenStore, langSettingStore, userInfoStore, themeStore } from '@/utils/human'
import { getSystemLang } from '@/utils/util'
import { UserInfo } from '@/types/User'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    userInfo: JSON.parse(userInfoStore.get() || `{
      "username": "",
      "avatar": ""
    }`),
    stores: { tokenStore, langSettingStore, userInfoStore, themeStore },
    token: tokenStore.get() || '',
    lang: langSettingStore.get() || getSystemLang(),
    isLogin: true,
    atlas: 'HBA'
  },
  mutations: {
    updateUserInfo (state, userInfo) {
      state.userInfo = userInfo
    },

    updateToken (state, token) {
      state.token = token
    },

    updateLang (state, lang) {
      state.lang = lang
    },

    updateLoginStatus (state: any, status: boolean) {
      state.isLogin = status
    },

    updateAtlas (state: any, atlasName: string) {
      state.atlas = atlasName
    }
  },
  actions: {
    updateToken ({ commit }, token) {
      commit('updateToken', token)
      tokenStore.set(token)
    },

    updateLang ({ commit }, lang) {
      commit('updateLang', lang)
      langSettingStore.set(lang)
    },

    updateUserInfo ({ commit }, userInfo: UserInfo) {
      commit('updateUserInfo', userInfo)
      userInfoStore.set(JSON.stringify(userInfo))
    }
  },
  modules: {
  }
})
