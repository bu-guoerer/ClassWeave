const SCRIPT_LOAD_TIMEOUT = 15000;

export function waitForDocsApi(timeoutMs = SCRIPT_LOAD_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.DocsAPI) return resolve();
      if (Date.now() - start >= timeoutMs) return reject(new Error("ONLYOFFICE API 加载超时"));
      window.setTimeout(tick, 100);
    };
    tick();
  });
}

export async function loadOnlyOfficeScript(src) {
  if (window.DocsAPI) return;

  const existing = document.querySelector(`script[data-onlyoffice-src="${src}"]`);
  if (existing) {
    if (existing.dataset.loaded === "true") {
      await waitForDocsApi();
      return;
    }
    // 等待已存在的脚本加载
    await waitForDocsApi(); 
    return;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("ONLYOFFICE API 加载超时"));
    }, SCRIPT_LOAD_TIMEOUT);

    const onLoad = async () => {
      script.dataset.loaded = "true";
      cleanup();
      try {
        await waitForDocsApi();
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    const onError = () => {
      cleanup();
      reject(new Error("ONLYOFFICE API 加载失败"));
    };

    const cleanup = () => {
      window.clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
    };

    script.src = src;
    script.async = true;
    script.dataset.onlyofficeSrc = src;
    script.onload = onLoad;
    script.onerror = onError;
    document.head.appendChild(script);
  });
}