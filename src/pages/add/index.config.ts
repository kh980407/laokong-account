export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '新增账单',
      navigationBarBackgroundColor: '#f97316',
      navigationBarTextStyle: 'white'
    })
  : {
      navigationBarTitleText: '新增账单',
      navigationBarBackgroundColor: '#f97316',
      navigationBarTextStyle: 'white'
    }
