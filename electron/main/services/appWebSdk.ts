import path from 'node:path';

const APP_WEB_SDK_SCRIPT_MARKER = 'data-kian-native-sdk';
const APP_WEB_SDK_GLOBAL_NAME = 'KianNativeSDK';
const APP_WEB_SDK_ALIAS_NAME = 'kian';

export const APP_WEB_SDK_SAVE_FILE_PATH = '__sdk__/saveFileToAssets';

const buildBootstrapScript = (projectId?: string): string => {
  const projectIdLiteral = projectId ? `"${projectId.replace(/["\\]/g, '')}"` : 'null';
  return [
    '(function () {',
    '  if (typeof window === "undefined") return;',
    `  if (window.${APP_WEB_SDK_GLOBAL_NAME}) return;`,
    `  var __projectId__ = ${projectIdLiteral};`,
    '  var permissionNames = { camera: "camera", microphone: "microphone" };',
    '  var ensureMediaDevices = function () {',
    '    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {',
    '      throw new Error("KianNativeSDK: mediaDevices is not available");',
    '    }',
    '    return navigator.mediaDevices;',
    '  };',
    '  var queryPermission = async function (name) {',
    '    if (!navigator.permissions || typeof navigator.permissions.query !== "function") {',
    '      return "unsupported";',
    '    }',
    '    try {',
    '      var status = await navigator.permissions.query({ name: name });',
    '      return status && status.state ? status.state : "unknown";',
    '    } catch (_error) {',
    '      return "unknown";',
    '    }',
    '  };',
    '  var stopStream = function (stream) {',
    '    if (!stream || typeof stream.getTracks !== "function") return;',
    '    var tracks = stream.getTracks();',
    '    for (var i = 0; i < tracks.length; i += 1) {',
    '      try {',
    '        tracks[i].stop();',
    '      } catch (_error) {',
    '        // ignore',
    '      }',
    '    }',
    '  };',
    '  var media = Object.freeze({',
    '    isSupported: function () {',
    '      return !!navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function";',
    '    },',
    '    getUserMedia: async function (constraints) {',
    '      return ensureMediaDevices().getUserMedia(constraints || { audio: true, video: true });',
    '    },',
    '    openCamera: async function () {',
    '      return ensureMediaDevices().getUserMedia({ video: true });',
    '    },',
    '    openMicrophone: async function () {',
    '      return ensureMediaDevices().getUserMedia({ audio: true });',
    '    },',
    '    getDisplayMedia: async function (options) {',
    '      var devices = ensureMediaDevices();',
    '      if (typeof devices.getDisplayMedia !== "function") {',
    '        throw new Error("KianNativeSDK: getDisplayMedia is not available");',
    '      }',
    '      return devices.getDisplayMedia(options || { video: true });',
    '    },',
    '    enumerateDevices: async function () {',
    '      var devices = ensureMediaDevices();',
    '      if (typeof devices.enumerateDevices !== "function") return [];',
    '      return devices.enumerateDevices();',
    '    },',
    '    getPermissions: async function () {',
    '      return {',
    '        camera: await queryPermission(permissionNames.camera),',
    '        microphone: await queryPermission(permissionNames.microphone)',
    '      };',
    '    },',
    '    stopStream: stopStream',
    '  });',
    '  var saveFileToAssets = async function (fileName, data) {',
    '    if (!fileName || typeof fileName !== "string") {',
    '      throw new Error("KianNativeSDK: fileName must be a non-empty string");',
    '    }',
    '    if (!__projectId__) {',
    '      throw new Error("KianNativeSDK: projectId is not available");',
    '    }',
    '    var blob;',
    '    if (data instanceof Blob) {',
    '      blob = data;',
    '    } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {',
    '      blob = new Blob([data]);',
    '    } else if (typeof data === "string") {',
    '      blob = new Blob([data], { type: "text/plain" });',
    '    } else {',
    '      throw new Error("KianNativeSDK: data must be a Blob, ArrayBuffer, TypedArray, or string");',
    '    }',
    `    var url = "kian-local://local/${APP_WEB_SDK_SAVE_FILE_PATH}"`,
    '      + "?projectId=" + encodeURIComponent(__projectId__)',
    '      + "&fileName=" + encodeURIComponent(fileName);',
    '    var response = await fetch(url, { method: "POST", body: blob });',
    '    if (!response.ok) {',
    '      var errorText = await response.text().catch(function () { return "Unknown error"; });',
    '      throw new Error("KianNativeSDK: saveFileToAssets failed: " + errorText);',
    '    }',
    '    return response.json();',
    '  };',
    '  var sdk = Object.freeze({',
    '    version: "1.0.0",',
    '    platform: "kian-electron-app-preview",',
    '    capabilities: Object.freeze({',
    '      camera: true,',
    '      microphone: true,',
    '      displayCapture: !!navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === "function",',
    '      saveFile: true',
    '    }),',
    '    media: media,',
    '    saveFileToAssets: saveFileToAssets',
    '  });',
    `  Object.defineProperty(window, "${APP_WEB_SDK_GLOBAL_NAME}", {`,
    '    value: sdk,',
    '    configurable: false,',
    '    writable: false',
    '  });',
    `  if (!window.${APP_WEB_SDK_ALIAS_NAME}) {`,
    `    Object.defineProperty(window, "${APP_WEB_SDK_ALIAS_NAME}", {`,
    '      value: sdk,',
    '      configurable: false,',
    '      writable: false',
    '    });',
    '  }',
    '})();',
  ].join('\n');
};

const APP_DIST_SEGMENT = `${path.sep}app${path.sep}dist${path.sep}`;

export const shouldInjectAppWebSdk = (filePath: string): boolean => {
  const normalized = path.normalize(filePath).toLowerCase();
  return normalized.includes(APP_DIST_SEGMENT) && normalized.endsWith('.html');
};

export const injectAppWebSdkIntoHtml = (html: string, projectId?: string): string => {
  if (!html || html.includes(APP_WEB_SDK_SCRIPT_MARKER)) {
    return html;
  }

  const script = buildBootstrapScript(projectId);
  const tag = `<script ${APP_WEB_SDK_SCRIPT_MARKER}>${script}</script>`;

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${tag}\n</head>`);
  }

  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body[^>]*>/i, (matched) =>
      `${matched}\n${tag}`,
    );
  }

  return `${tag}\n${html}`;
};
