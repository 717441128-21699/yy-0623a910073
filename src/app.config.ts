export default defineAppConfig({
  pages: [
    'pages/today/index',
    'pages/followups/index',
    'pages/patients/index',
    'pages/mine/index',
    'pages/patientDetail/index',
    'pages/scheduleFollowup/index',
    'pages/followupDetail/index',
    'pages/noShowFollowup/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0FA5A5',
    navigationBarTitleText: '口腔复诊助手',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#0FA5A5',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/today/index',
        text: '今日日程'
      },
      {
        pagePath: 'pages/followups/index',
        text: '复诊待办'
      },
      {
        pagePath: 'pages/patients/index',
        text: '患者管理'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
