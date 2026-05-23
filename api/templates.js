import { templates } from "./_data.js";

export default function handler(_request, response) {
  response.status(200).json({ templates });
}
