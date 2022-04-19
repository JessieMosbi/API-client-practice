

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
  instance: null,
  init () {
    this.instance = axios.create({
      baseURL: 'http://dataapimanage:8888'
    });
  },
  getAccessToken (email, password) {
    return new Promise((resolve, reject) => {
      return this.instance.post('/login', { // arrow function 沒有自己的 this，會指向外層函式作用域的 this
        email,
        password
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

            resolve(true)
          }
        })
        .catch(err => reject(err))
    })
  },
  getTestData () {
    return this.instance.post('/test')
      .then(({ data }) => {
        return data
      })
      .catch(err => console.log(err.response))
  }
}

// ApiHelper.init()
// ApiHelper.getAccessToken(email, password)


const email = 'hamy820326@gmail.com'
const password = '12345678';



(async (email, password) => {
  try {
    ApiHelper.init()

    if (await ApiHelper.getAccessToken(email, password)) {
      const result = await ApiHelper.getTestData()
      console.log(result)
    }
  } catch (err) {
    console.log(err)
  }
})(email, password);