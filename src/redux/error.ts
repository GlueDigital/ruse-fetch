export class CustomError<T> extends Error {
  status: number
  payload: T

  constructor(message: string, status: number, payload: T) {
    super(message)
    this.name = 'CustomError' // Nombre del error
    this.status = status
    this.payload = payload

    // Ajustar la traza del stack para excluir el constructor del error
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError)
    }
  }
}

export const createError = <T>(
  msg: string,
  res: { status: number },
  value: T
) => {
  return new CustomError(msg, res.status, value)
}
