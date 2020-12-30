import { NextApiHandler } from "next"

// Ultralightweight wrapper around handler that just adds types
export const createHandler = <T = any>(
  cb: NextApiHandler<T>
): NextApiHandler<T> => cb
