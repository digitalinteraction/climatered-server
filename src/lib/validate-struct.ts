import { ApiError } from '@openlab/deconf-api-toolkit'
import { Struct, validate } from 'superstruct'

export function validateStruct<T>(value: unknown, struct: Struct<T>) {
  const result = validate(value, struct)
  if (result[0]) throw ApiError.badRequest()
  return result[1]
}
