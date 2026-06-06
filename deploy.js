const https = require("https");
const fs = require("fs");
const { execSync } = require("child_process");

const TOKEN = fs.readFileSync("/tmp/vercel_token.txt", "utf8").trim();

function apiCall(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.vercel.com${path}`);
    const postData = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        ...(postData ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(postData) } : {}),
      },
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function main() {
  // 1. Get project
  console.log("Getting project...");
  const project = await apiCall("GET", "/v10/projects/aryvora");
  const projectId = project.body.id;
  console.log(`Project: ${project.body.name} (${projectId})`);

  // 2. Create a new deployment
  console.log("Creating deployment...");
  const deploy = await apiCall("POST", `/v13/deployments?projectId=${projectId}&forceNew=1`, {
    name: "aryvora",
    target: "production",
  });
  
  if (deploy.status >= 400) {
    console.error("Deployment failed:", JSON.stringify(deploy.body, null, 2));
    process.exit(1);
  }

  const deployId = deploy.body.id;
  const deployUrl = deploy.body.url;
  console.log(`Deploying...`);
  console.log(`  ID: ${deployId}`);
  console.log(`  URL: https://${deployUrl}`);
  console.log(`  Status: ${deploy.body.readyState || "INITIALIZED"}`);

  // 3. Poll for completion
  let attempts = 0;
  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 10000));
    attempts++;
    const status = await apiCall("GET", `/v13/deployments/${deployId}`);
    const state = status.body.readyState;
    const url = status.body.url;
    console.log(`  [${attempts}] ${state} -> https://${url}`);
    if (state === "READY" || state === "ERROR") break;
  }

  console.log(`\n✅ Production URL: https://${deployUrl}`);
}

main().catch(console.error);
