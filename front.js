// TODO: 後端開了多條 API，沒有先後順序問題的話，用 Promise.all 同時請求吧

const ApiHelper = {
  email: 'hamy820326@gmail.com',
  password: '12345678',
  instance: null,
  init () {
    console.log('axios init')
    this.instance = axios.create({
      baseURL: 'http://dataapimanage:8888'
    });

    // Add a response interceptor
    this.instance.interceptors.response.use(function (response) {
      // Any status code that lie within the range of 2xx cause this function to trigger
      // Do something with response data
      return response;
    }, async (error) => {
      // Any status codes that falls outside the range of 2xx cause this function to trigger
      // Do something with response error
      console.log(error.response)
      if (error.response.status === 401 && error.response.data.message === 'The token expired.') {
        console.log('first get data request: fail, with token expired.')
        // FIXME: 這邊應該不用用 try catch 包了？因為最外層的 frontView.init() 就有包
        // try {
        //   await this.getAccessToken()
        //   error = 'already re-get access token'
        //   console.log(`set error message: ${error}`)
        // } catch (err) {
        //   console.log('interceptors catch error')
        //   error = err
        // }
        await this.getAccessToken()
        error = 'already re-get access token'
        console.log(`interceptors: set message to get data func: ${error}`)
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
      .then(response => {
        console.log(`get token request status is ${response.status}`)
        return response.data
      })
      .then(({ status, result }) => {
        if (status === 'success') {
          localStorage.setItem('token', result.access_token)
          console.log('after getting token: set to local storage')

          // Alter defaults after instance has been created
          this.instance.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`
          console.log('after getting token: set to axios header')

          return true
        }
      })
      .catch(err => false)
  },
  async checkToken () {
    console.log('start to check token')

    // TODO: 多個 await 可以用同一個 try/catch 包起來嗎？（在 AC 好像有問過...）
    if (!localStorage.getItem('token')) {
      console.log('token is not exist in local storage')
      await this.getAccessToken()
    }

    // Alter defaults after instance has been created
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`
    console.log('token exist, set to axios header')
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
    const result = await request()
    if (result === 'already re-get access token') {
      const result = await request()
      console.log('second get data request finished')
      return result
    }
    else return result
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
      console.log('frontVirw catch error')
      console.log(err)
    }
  }
}

try {
  // TODO: 沒傳帳密則 Server return 404 好像不是 fail json???
  frontView.init()
} catch (error) {
  console.log('top try/cache level cache error')
  console.log(error)
}