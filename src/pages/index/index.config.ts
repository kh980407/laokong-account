export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '电子账本',
      navigationBarBackgroundColor: '#f97316',
      navigationBarTextStyle: 'white',
      enablePullDownRefresh: true,
      backgroundTextStyle: 'light'
    })
  : {
      navigationBarTitleText: '电子账本',
      navigationBarBackgroundColor: '#f97316',
      navigationBarTextStyle: 'white',
      enablePullDownRefresh: true,
      backgroundTextStyle: 'light'
    }
