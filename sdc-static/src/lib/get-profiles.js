import axios from 'axios'

export default function (data) {
  return axios({
    method: 'post',
    url: 'http://localhost:5000/api/get_profiles',
    data: JSON.parse(data),
    headers: {'Content-Type': 'application/xml'}
  })
    .then((response) => {
      return response.data
    })
}
