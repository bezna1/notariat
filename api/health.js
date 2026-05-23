export default function handler(_request, response) {
  response.status(200).json({
    ok: true,
    mode: "vercel-test-backend",
    timestamp: new Date().toISOString(),
  });
}
