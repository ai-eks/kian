const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

/**
 * electron-builder afterSign hook.
 *
 * Called after code signing completes. Submits the .app bundle for
 * Apple notarization and staples the ticket on success.
 *
 * Required environment variables (set in CI or .env.local):
 *   NOTARY_API_KEY_PATH  — path to AuthKey_*.p8
 *   NOTARY_API_KEY_ID    — App Store Connect API Key ID
 *   NOTARY_API_ISSUER_ID — App Store Connect API Issuer ID
 */
exports.default = async function afterSign(context) {
  if (context.packager.platform.name !== 'mac') {
    console.log('afterSign: skipping — not macOS');
    return;
  }

  const keyPath = process.env.NOTARY_API_KEY_PATH;
  const keyId = process.env.NOTARY_API_KEY_ID;
  const issuerId = process.env.NOTARY_API_ISSUER_ID;

  if (!keyPath || !keyId || !issuerId) {
    console.log('afterSign: skipping notarization — credentials not set');
    return;
  }

  const appPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`
  );

  if (!fs.existsSync(appPath)) {
    throw new Error(`afterSign: app bundle not found at ${appPath}`);
  }

  console.log(`afterSign: notarizing ${appPath}`);

  // Create a temporary zip for notarization submission
  const zipPath = path.join(
    os.tmpdir(),
    `${context.packager.appInfo.productFilename}-notarize.zip`
  );

  try {
    execSync(`ditto -c -k --sequesterRsrc --keepParent "${appPath}" "${zipPath}"`, {
      stdio: 'inherit'
    });

    execSync(
      `xcrun notarytool submit "${zipPath}"` +
        ` --key "${keyPath}"` +
        ` --key-id "${keyId}"` +
        ` --issuer "${issuerId}"` +
        ` --wait`,
      { stdio: 'inherit' }
    );

    console.log('afterSign: stapling notarization ticket');
    execSync(`xcrun stapler staple "${appPath}"`, { stdio: 'inherit' });
  } finally {
    // Clean up temp zip
    try {
      fs.unlinkSync(zipPath);
    } catch {}
  }

  console.log('afterSign: notarization complete');
};
