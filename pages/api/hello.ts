import { createHandler } from "utils/api";

export default createHandler((req, res) => {
  res.end("Hello");
});
