

// TODO: 401 state 應該要由我們處理
// function getTestData () {
//   return ApiHelper.post('/test')
//     .then(({ data }) => {
//       return data
//     })
//     .catch(err => console.log(err.response))
// }

// TODO: 處理 state
// TODO: 若 token 過期，則重新要一次

// const getAccessToken = (email, password) => {

// }


const ApiHelper = {
  email: 'hamy820326@gmail.com',
  password: '12345678',
  instance: null,
  init () {
    console.log('axios init')
    this.instance = axios.create({
      baseURL: 'http://dataapimanage:8888'
    });
  },
  getAccessToken () {
    console.log('getAccessToken')
    return new Promise((resolve, reject) => {
      // arrow function 沒有自己的 this，會指向外層函式作用域的 this
      // TODO: 解構復職
      return this.instance.post('/login', {
        email: this.email,
        password: this.password
      })
        .then(response => {
          console.log(response.status)
          return response.data
        })
        .then(({ status, result }) => {
          if (status === 'success') {
            localStorage.setItem('token', result.access_token)

            // Alter defaults after instance has been created
            this.instance.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`
            console.log('set token to axios header 1')

            resolve(true)
          }
        })
        .catch(err => reject(err))
    })
  },
  async checkToken () {
    console.log('check token')

    if (!localStorage.getItem('token')) await this.getAccessToken()

    // Alter defaults after instance has been created
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`
    console.log('set token to axios header 2')

    // TODO: move to other place!!
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
        try {
          await this.getAccessToken()
          error = 'already re-get access token'
          console.log(`set error message: ${error}`)
        } catch (err) {
          error = err
        }
      }

      return Promise.reject(error);
    });
  },
  async getData (subPath) {
    // TODO: 應該不用 async/await 了
    const request = async () => {
      console.log('get data request')
      return await this.instance.post(`/${subPath}`)
        .then(({ data }) => {
          return data
        })
        .catch(err => {
          return err
        })
    }
    await this.checkToken() // FIXME: 這裡要加 await...
    const result = await request()
    if (result === 'already re-get access token') return await request()
    else return result
  }
}

// ApiHelper.init()
// ApiHelper.getAccessToken(email, password)



const frontView = {
  async init () {
    try {
      if (!ApiHelper.instance) ApiHelper.init()

      const result = await ApiHelper.getData('test')
      console.log(result)
    } catch (err) {
      console.log(err)
    }
  }
}

// 沒穿帳密則 Server return 404 好像不是 fail json???
frontView.init()


  // (async (email, password) => {
  //   try {
  //     ApiHelper.init()

  //     if (await ApiHelper.getAccessToken(email, password)) {
  //       const result = await ApiHelper.getTestData()
  //       console.log(result)
  //     }
  //   } catch (err) {
  //     console.log(err)
  //   }
  // })(email, password);