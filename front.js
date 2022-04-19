const instance = axios.create({
  baseURL: 'http://dataapimanage:8888'
});

// TODO: 401 state 應該要由我們處理
function getTestData () {
  return instance.post('/test')
    .then(({ data }) => {
      return data
    })
    .catch(err => console.log(err.response))
}
// getTestData();

// function login (email, password) {
//   // TODO: 可以自訂 promise fullfield 跟 reject 要跑的 function
//   return instance.post('/login', {
//     email,
//     password
//   })
//     .then(response => response.data)
//     .then(({ status, result }) => {
//       if (status === 'success') {
//         // token 存在 local storage
//         localStorage.setItem('token', result.access_token)
//         console.log(`store token: ${result.access_token}`)
//       }
//     })
//     .catch(err => console.log(err.response))
// }

// TODO: 處理 state
// TODO: 若 token 過期，則重新要一次

const getAccessToken = (email, password) => {
  return new Promise((resolve, reject) => {
    return instance.post('/login', {
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
          instance.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`

          resolve(true)
        }
      })
      .catch(err => reject(err))
  })
}

const email = 'hamy820326@gmail.com'
const password = '12345678';
(async (email, password) => {
  try {
    if (await getAccessToken(email, password)) {
      const result = await getTestData()
      console.log(result)
    }
  } catch (err) {
    console.log(err)
  }
})(email, password);