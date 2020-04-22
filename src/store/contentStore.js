
const contentStore = {
  namespaced: true,
  state: {
    content: {
      products: null,
      productPage: null
    }
  },
  getters: {
    getContent: state => pageId => {
      const matches = state.content.filter(content => content.pages.id === pageId)
      return matches
    },
    getProductPage: state => {
      return state.content.productPage
    },
    getProducts: state => {
      return state.content.products
    }
  },
  mutations: {
    addProducts (state, o) {
      state.content.products = o
    },
    addProductPage (state, o) {
      state.content.productPage = o
    }
  },
  actions: {
  }
}
export default contentStore
