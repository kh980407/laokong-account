export default defineAppConfig({
  // 组件按需注入，减小包体、通过代码质量检查
  lazyCodeLoading: 'requiredComponents',
  pages: [
    'pages/index/index',
    'pages/add/index',
    'pages/detail/index',
    'pages/edit/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '老孔记账本',
    navigationBarTextStyle: 'black'
  }
})
