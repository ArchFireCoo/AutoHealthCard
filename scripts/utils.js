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

const getDaysBetween = (start, stop) => (Date.parse(stop) - Date.parse(start)) / (1 * 24 * 60 * 60 * 1000)

const generateRangeArr = (start, stop, padStr) =>
  Array.from({ length: stop - start + 1 }, (_, i) => padStr + (+start + i))

const generateDateRangeArr = (start, stop) =>
  Array.from({ length: getDaysBetween(start, stop) + 1 }, (_, i) => {
    const date = new Date(start)
    date.setDate(date.getDate() + i)
    return date
  })

const concatRangeArr = (rangeArr, isDate = false) =>
  rangeArr.reduce((prev, cur) => {
    const range = cur.split(':')

    if (!range[1]) return prev.concat(isDate ? new Date(range[0]) : range)

    const padStr = range[0][0] === '0' ? '0' : ''
    const curRangeArr = isDate
      ? generateDateRangeArr(range[0], range[1])
      : generateRangeArr(range[0], range[1], padStr)

    return prev.concat(curRangeArr)
  }, [])

const createCurry = (func, args) => {
  var arity = func.length
  var args = args || []

  return function () {
    let _args = Array.from(arguments).concat(args)

    if (_args.length < arity) return createCurry.call(this, func, _args)

    return func.apply(this, _args)
  }
}

module.exports = {
  removeNullsInObject,
  keysToLowerCase,
  datePadZero,
  generateRangeArr,
  generateDateRangeArr,
  concatRangeArr,
  createCurry,
}
