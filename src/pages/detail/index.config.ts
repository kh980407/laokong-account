export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '账单详情',
      navigationBarBackgroundColor: '#f97316',
      navigationBarTextStyle: 'white'
    })
  : {
      navigationBarTitleText: '账单详情',
      navigationBarBackgroundColor: '#f97316',
      navigationBarTextStyle: 'white'
    }
