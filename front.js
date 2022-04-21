// TODO: 後端開了多條 API，沒有先後順序問題的話，用 Promise.all 同時請求吧

const ApiHelper = {
  email: 'hamy820326@gmail.com',
  password: '12345678',
  instance: null,
  init () {
    console.log('axios init')
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

      // if (error.response.status === 401 && error.response.data.message === 'The token expired.') {
      //   console.log('first get data request: fail, with token expired.')

      //   const { status, result } = (await this.getAccessToken()).data
      //   if (status === 'success') {
      //     this.setAccessToken(result.access_token)
      //   }

      //   error = 'already re-get access token'
      //   console.log(`interceptors: set message to get data func: ${error}`)
      //   // return Promise.resolve(error);
      // }

      console.log(error.response)

      const { status, message } = error.response.data
      switch (error.response.status) {
        case 400:
          error = 'email and account incorrect'
          break;

        case 401:
          if (message === 'The token expired.') {
            console.log('first get data request: fail, with token expired.')

            const { status, result } = (await this.getAccessToken()).data
            if (status === 'success') {
              this.storeAccessToken(result.access_token)
              this.setAccessToken()
            }

            error = 'already re-get access token'
            console.log(`interceptors: set message to get data func: ${error}`)
            // return Promise.resolve(error);
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
    console.log('get access token')

    return this.instance.post('/login', {
      email: this.email,
      password: this.password
    })
    // .then(response => {
    //   console.log(`get token request status is ${response.status}`)
    //   return response.data
    // })
    // .then(({ status, result }) => {
    //   if (status === 'success') {
    //     localStorage.setItem('token', result.access_token)
    //     console.log('after getting token: set to local storage')

    //     // Alter defaults after instance has been created
    //     this.instance.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`
    //     console.log('after getting token: set to axios header')

    //     return true
    //   }
    // })
    // .catch(err => false)
  },
  setAccessToken () {
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`
  },
  storeAccessToken (token) {
    localStorage.setItem('token', token)
  },
  async checkToken () {
    console.log('start to check token')

    if (!localStorage.getItem('token')) {
      console.log('token is not exist in local storage')

      const { status, result } = (await this.getAccessToken()).data
      if (status === 'success') {
        this.storeAccessToken(result.access_token)
      }
    }
    this.setAccessToken()
  },
  async getData (subPath) {
    const request = () => {
      console.log('get data request')
      return this.instance.post(`/${subPath}`)
        .then(({ data }) => data)
        .catch(err => err)
    }

    // 這裡沒加 await 的話，代表我不等 checkToken 裡面的 非同步了，會直接執行下一行的 console.log('after check token')，然後繼續往下
    // 會導致 local storage 沒有 token 的情況下，送第二次 get data request 還是回傳 401
    // 最後，checkToken 裡面的非同步結果回來了，才印出裡面的 console 內容。接下來繼續執行 checkToken 接下來的程式碼
    // 結論：只要我呼叫的 function 裡面有包含 async code，如果我希望他在我這裡按照「同步」的方式進行，則要寫 await！（不管他自己內部 code 如何處理、是否以同步的方式執行）
    await this.checkToken()
    console.log('after check token')

    try {
      let result = await request()
      if (result === 'already re-get access token') {
        console.log(`receive message: ${result}`)
        result = await request()
        console.log('second get data request finished')
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

      // 這裡要加 await，否則會直接先執行下一行的 console.log(result) 印出 Promise pending
      const result = await ApiHelper.getData('test')
      console.log(result)
    } catch (err) {
      console.warn(err)
    }
  }
}

try {
  // TODO: 沒傳帳密則 Server return 404 好像不是 fail json???
  frontView.init()
} catch (error) {
  console.warn(error)
}