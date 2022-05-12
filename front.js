const ApiHelper = {
  // TODO: email and password inserted by user in the future
  email: 'test@gmail.com',
  password: '12345678',
  instance: null,
  init () {
    this.instance = axios.create({
      baseURL: 'http://dataapimanage:8888',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });

    // Add a response interceptor
    this.instance.interceptors.response.use(function (response) {
      // Any status code that lie within the range of 2xx cause this function to trigger
      // Do something with response data
      return response;
    }, async (error) => {
      // Any status codes that falls outside the range of 2xx cause this function to trigger
      // Do something with response error

      const { status, message } = error.response.data
      switch (error.response.status) {
        case 400:
          error = 'email and account incorrect'
          break;

        case 401:
          if (message === 'The token expired.') {
            // TODO: logout in the future, dont't need to re-get token
            const { status, result } = (await this.getAccessToken()).data
            if (status === 'success') {
              this.storeAccessToken(result.access_token)
              this.setAccessToken()
            }
            error = 'already re-get access token'
          } else {
            error = 'token unauthorized, please login again'
          }
          break;

        case 404:
          error = 'request url is invalid'
          break;

        default:
          break;
      }

      return Promise.reject(error);
    });
  },
  getAccessToken () {
    return this.instance.post('/login', {
      email: this.email,
      password: this.password
    })
  },
  setAccessToken () {
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`
  },
  storeAccessToken (token) {
    localStorage.setItem('token', token)
  },
  async checkToken () {
    if (!localStorage.getItem('token')) {
      // TODO: rediract to login page in the future, dont't need to re-get token
      const { status, result } = (await this.getAccessToken()).data
      if (status === 'success') {
        this.storeAccessToken(result.access_token)
      }
    }
    this.setAccessToken()
  },
  async getData (subPath) {
    const request = () => {
      return this.instance.post(`/${subPath}`)
        .then(({ data }) => data)
        .catch(err => err)
    }

    await this.checkToken()
    try {
      // TODO: will logout in the future, dont't need to re-send request
      let result = await request()
      if (result === 'already re-get access token') {
        result = await request()
      }
      return result
    } catch (error) {
      console.warn(error)
    }
  }
}

const frontView = {
  async init () {
    try {
      if (!ApiHelper.instance) ApiHelper.init()

      const result = await ApiHelper.getData('test')
      if (typeof result === 'object' && result !== null) {
        // TODO: 前端頁面對 init 撈回來的資料處理
        console.log(result)
      }
      else {
        // TODO: 前端頁面顯示錯誤訊息
        console.warn(result)
      }
    } catch (err) {
      console.warn(err)
    }
  }
}

// TODO: 後端開了多條 API，沒有先後順序問題的話，用 Promise.all 同時請求吧
try {
  frontView.init()
} catch (error) {
  console.warn(error)
}