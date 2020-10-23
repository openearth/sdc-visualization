export default function (data) {
  // define url based on the rest api url, can vary between environments
  const url = `${process.env.VUE_APP_REST}/api/get_profiles`
  return fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  })
    .then((resp) => {
      return resp.json()
    })
}
