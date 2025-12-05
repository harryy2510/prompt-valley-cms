export type InputNumberValue = null | number | string | undefined

type Options = Intl.NumberFormatOptions

export function fCurrency(inputValue: InputNumberValue, options?: Options) {
  const number = processInput(inputValue)
  if (number === null) return ''

  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
    ...options,
  }).format(number)
}

export function fData(inputValue: InputNumberValue) {
  const number = processInput(inputValue)
  if (number === null || number === 0) return '0 bytes'

  const units = ['bytes', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb']
  const decimal = 2
  const baseValue = 1024

  const index = Math.floor(Math.log(number) / Math.log(baseValue))
  return `${parseFloat((number / baseValue ** index).toFixed(decimal))} ${units[index]}`
}

export function fNumber(inputValue: InputNumberValue, options?: Options) {
  const number = processInput(inputValue)
  if (number === null) return ''

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    ...options,
  }).format(number)
}

export function fPercent(inputValue: InputNumberValue, options?: Options) {
  const number = processInput(inputValue)
  if (number === null) return ''

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
    style: 'percent',
    ...options,
  }).format(number / 100)
}

export function fShortenNumber(
  inputValue: InputNumberValue,
  options?: Options,
) {
  const number = processInput(inputValue)
  if (number === null) return ''

  const fm = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    notation: 'compact',
    ...options,
  }).format(number)

  return fm.replace(/[A-Z]/g, (match) => match.toLowerCase())
}

function processInput(inputValue: InputNumberValue): null | number {
  if (inputValue === null || Number.isNaN(inputValue)) return null
  return Number(inputValue)
}
