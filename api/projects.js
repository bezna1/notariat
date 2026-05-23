import { randomUUID } from "node:crypto";
import { projects } from "./_data.js";

export default function handler(request, response) {
  if (request.method === "GET") {
    response.status(200).json({ projects });
    return;
  }

  if (request.method === "POST") {
    const project = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...request.body,
    };
    projects.unshift(project);
    response.status(201).json({ project });
    return;
  }

  response.setHeader("Allow", "GET, POST");
  response.status(405).json({ error: "Method not allowed" });
}
