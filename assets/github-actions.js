export function getWorkflowDispatchEndpoint({ repository, workflowFile }) {
  return `https://api.github.com/repos/${repository}/actions/workflows/${workflowFile}/dispatches`;
}

export function buildWorkflowDispatchRequest({
  repository,
  workflowFile,
  ref,
  token
}) {
  return {
    url: getWorkflowDispatchEndpoint({ repository, workflowFile }),
    options: {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: JSON.stringify({ ref })
    }
  };
}

export async function parseWorkflowDispatchError(response) {
  let message = `${response.status} ${response.statusText}`.trim();

  try {
    const payload = await response.json();
    if (payload?.message) {
      message = payload.message;
    }
  } catch {
    // Keep the HTTP status when GitHub does not return a JSON body.
  }

  return `GitHub rejected the update request: ${message}`;
}

export async function dispatchWorkflow({ repository, workflowFile, ref, token }) {
  const request = buildWorkflowDispatchRequest({
    repository,
    workflowFile,
    ref,
    token
  });
  const response = await fetch(request.url, request.options);

  if (!response.ok) {
    throw new Error(await parseWorkflowDispatchError(response));
  }

  return response;
}
