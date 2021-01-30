const removeNullsInObject = (obj) => {
  for (let key in obj) {
    if (!obj[key]) {
      delete obj[key]
    }
  }
  return obj
}

const keysToLowerCase = (obj) => {
  for (let key in obj) {
    const lowercaseKey = key.toLowerCase()
    if (key !== lowercaseKey) {
      obj[lowercaseKey] = obj[key]
      delete obj[key]
    }
  }
  return obj
}

const datePadZero = (item) => item.toString().padStart(2, '0')

const generateRangeArr = (start, stop, str) =>
  Array.from({ length: stop - start + 1 }, (_, i) => str + (start + i))

module.exports = {
  removeNullsInObject,
  keysToLowerCase,
  datePadZero,
  generateRangeArr,
}
